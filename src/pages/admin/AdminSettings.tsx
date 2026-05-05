import { useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { FiSave } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useSettingsStore } from '../../stores/settingsStore';
import { saveSettings, DEFAULT_SETTINGS } from '../../lib/settings';
import { initGA, initPixel } from '../../lib/pixel';
import type { SiteSettings } from '../../types';

type FormState = SiteSettings;

export function AdminSettings() {
  const settings = useSettingsStore((s) => s.settings);
  const loaded = useSettingsStore((s) => s.loaded);
  const [form, setForm] = useState<FormState>(settings);
  const [busy, setBusy] = useState(false);
  const hydrated = useRef(false);

  // Hydrate the form from Firestore once the realtime settings doc finishes
  // loading. Subsequent realtime patches do not overwrite local edits.
  useEffect(() => {
    if (loaded && !hydrated.current) {
      hydrated.current = true;
      setForm(settings);
    }
  }, [loaded, settings]);

  function bind<K extends keyof FormState>(key: K) {
    return {
      value: (form[key] ?? '') as string | number,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const t = e.target;
        const v: string | number = t.type === 'number' ? Number(t.value || 0) : t.value;
        setForm((p) => ({ ...p, [key]: v }) as FormState);
      },
    };
  }

  async function onSave() {
    setBusy(true);
    try {
      await saveSettings(form);
      toast.success('Settings saved');
      // re-init analytics to pick up new IDs without a full reload
      initPixel(form.metaPixelId);
      initGA(form.gaMeasurementId);
    } catch (e) {
      const code =
        e && typeof e === 'object' && 'code' in e ? (e as { code: string }).code : null;
      if (code === 'permission-denied') {
        toast.error('Permission denied — make sure your account has admin role in Firestore');
      } else {
        toast.error(e instanceof Error ? e.message : 'Save failed');
      }
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    if (confirm('Reset all settings to defaults?')) {
      setForm(DEFAULT_SETTINGS);
    }
  }

  return (
    <>
      <Helmet><title>Settings — Admin</title></Helmet>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="heading text-2xl font-extrabold">Site Settings</h1>
          <p className="text-sm text-slate-500">
            Configure delivery charges, payment numbers, admin contacts, integrations and SEO.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={reset} className="btn-outline text-xs">Reset to defaults</button>
          <button onClick={onSave} disabled={busy} className="btn-primary text-xs">
            <FiSave className="h-4 w-4" />
            {busy ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Section title="Delivery charges" subtitle="Inside / outside Dhaka and free-delivery threshold.">
          <Field label="Inside Dhaka (BDT)" type="number" {...bind('deliveryInside')} />
          <Field label="Outside Dhaka (BDT)" type="number" {...bind('deliveryOutside')} />
          <Field
            label="Free delivery above (BDT)"
            type="number"
            help="Set to 0 to always charge delivery."
            {...bind('freeDeliveryAbove')}
          />
        </Section>

        <Section title="Payments" subtitle="Personal bKash / Nagad numbers shown on checkout.">
          <Field label="bKash personal number" {...bind('bkashNumber')} />
          <Field label="Nagad personal number" {...bind('nagadNumber')} />
        </Section>

        <Section title="Admin contact" subtitle="Where new-order alerts are sent.">
          <Field label="Admin SMS phone (digits)" placeholder="+8801..." {...bind('adminSmsPhone')} />
          <Field label="Admin email" type="email" {...bind('adminEmail')} />
          <Field label="Public phone (E.164)" {...bind('contactPhone')} />
          <Field label="Public phone display" {...bind('contactPhoneDisplay')} />
          <Field label="Public WhatsApp number" placeholder="8801..." {...bind('whatsappNumber')} />
          <Field label="Messenger URL" {...bind('messengerUrl')} />
          <Field label="Support email" {...bind('supportEmail')} />
        </Section>

        <Section
          title="Notification webhooks"
          subtitle="POST endpoints for SMS / Email gateways (Zapier, Make, n8n, custom backend). Leave empty to disable that channel."
        >
          <Field label="SMS webhook URL" {...bind('smsWebhookUrl')} />
          <Field label="Email webhook URL" {...bind('emailWebhookUrl')} />
        </Section>

        <Section title="Tracking" subtitle="Marketing pixels — leave empty to disable.">
          <Field label="Meta Pixel ID" placeholder="e.g. 123456789012345" {...bind('metaPixelId')} />
          <Field label="Google Analytics 4 ID" placeholder="G-XXXXXXX" {...bind('gaMeasurementId')} />
        </Section>

        <Section title="Branding" subtitle="Brand name and short taglines used across the site.">
          <Field label="Brand name" {...bind('brandName')} />
          <Field label="Tagline (EN)" {...bind('brandTagline')} />
          <Field label="Tagline (BN)" {...bind('brandTaglineBn')} />
        </Section>

        <Section title="Social" subtitle="Public social profile URLs shown in the footer.">
          <Field label="Facebook URL" {...bind('facebookUrl')} />
          <Field label="Instagram URL" {...bind('instagramUrl')} />
        </Section>

        <Section title="SEO" subtitle="Default meta tags. Per-page tags can override these.">
          <Field label="SEO description (EN)" {...bind('seoDescription')} />
          <Field label="SEO description (BN)" {...bind('seoDescriptionBn')} />
          <Field label="SEO keywords (comma separated)" {...bind('seoKeywords')} />
          <Field label="Open Graph image URL" {...bind('ogImage')} />
        </Section>
      </div>

      <div className="card mt-6 border-amber-200 bg-amber-50/60 p-4 text-sm dark:border-amber-500/30 dark:bg-amber-500/10">
        <strong>Tip:</strong> If saving fails with "permission denied", set your Firestore
        <span className="font-mono"> users/&lt;uid&gt;.role = "admin"</span> manually in the
        Firebase Console for your account, then refresh and try again.
      </div>
    </>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="card p-5">
      <div className="mb-3">
        <h2 className="font-display text-sm font-bold uppercase tracking-wider">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function Field({
  label,
  help,
  ...rest
}: { label: string; help?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <input className="input mt-1" {...rest} />
      {help && <span className="mt-1 block text-[11px] text-slate-500">{help}</span>}
    </label>
  );
}
