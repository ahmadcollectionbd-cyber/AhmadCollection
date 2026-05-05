import { useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { FiSave, FiSend, FiRefreshCw, FiSettings } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useSettingsStore } from '../../stores/settingsStore';
import { saveSettings, DEFAULT_SETTINGS } from '../../lib/settings';
import { initGA, initPixel } from '../../lib/pixel';
import { sendEmailViaEmailJs, isEmailJsConfigured } from '../../lib/emailjs';
import { sendEmailViaServerless } from '../../lib/notifications';
import { resyncCatalogFromCode } from '../../lib/firestore';
import {
  banners as seedBanners,
  categories as seedCategories,
  coupons as seedCoupons,
  products as seedProducts,
} from '../../data/seed';
import type { SiteSettings } from '../../types';
import { ImageInput } from '../../components/ui/ImageInput';
import { PageHeader } from '../../components/admin/PageHeader';

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
      // The per-district override editor was retired in favour of the simpler
      // inside / outside Dhaka model — wipe any stale overrides so existing
      // Firestore documents stop applying them.
      await saveSettings({ ...form, deliveryDistricts: [] });
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

  async function testWebhook(kind: 'sms' | 'email') {
    const url = kind === 'sms' ? form.smsWebhookUrl : form.emailWebhookUrl;
    if (!url) {
      toast.error(`No ${kind.toUpperCase()} webhook URL set`);
      return;
    }
    const payload = {
      channel: kind,
      type: 'test',
      brand: form.brandName,
      adminPhone: form.adminSmsPhone,
      adminEmail: form.adminEmail,
      sms: `[${form.brandName}] Test SMS — webhook is reachable.`,
      email: {
        subject: `Test email — ${form.brandName}`,
        html: `<p>Test ping from ${form.brandName} admin settings.</p>`,
      },
      sentAt: new Date().toISOString(),
    };
    try {
      await fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      toast.success(
        `Test ${kind.toUpperCase()} POSTed. Check your Zapier/Make scenario / inbox.`,
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : `${kind} test failed`);
    }
  }

  async function testSmsApi() {
    if (!form.smsApiUrl || !form.smsApiToken) {
      toast.error('Configure SMS API URL and token first');
      return;
    }
    if (!form.adminSmsPhone) {
      toast.error('Set an admin SMS phone first');
      return;
    }
    try {
      let phone = form.adminSmsPhone.replace(/[\s\-()]/g, '');
      if (phone.startsWith('+88')) phone = phone.slice(3);
      else if (phone.startsWith('88')) phone = phone.slice(2);

      const url = new URL(form.smsApiUrl);
      url.searchParams.set('token', form.smsApiToken);
      url.searchParams.set('to', phone);
      url.searchParams.set('message', `[${form.brandName}] Test SMS — API is working.`);
      if (form.smsApiSenderId) url.searchParams.set('sender_id', form.smsApiSenderId);

      const res = await fetch(url.toString());
      if (res.ok) {
        toast.success(`Test SMS sent to ${form.adminSmsPhone}`);
      } else {
        toast.error(`SMS API returned ${res.status}`);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'SMS test failed');
    }
  }

  async function testEmailJs() {
    if (!isEmailJsConfigured(form)) {
      toast.error('Configure EmailJS service ID, template ID, and public key first');
      return;
    }
    if (!form.adminEmail) {
      toast.error('Set an admin email first');
      return;
    }
    const res = await sendEmailViaEmailJs(form, {
      to_email: form.adminEmail,
      subject: `Test email — ${form.brandName}`,
      message: `Test ping from ${form.brandName} admin settings. If you received this, your EmailJS integration is working.`,
      html: `<p>Test ping from <b>${form.brandName}</b> admin settings.</p>`,
      from_name: form.brandName,
      reply_to: form.adminEmail,
    });
    if (res.ok) {
      toast.success(`Test email sent to ${form.adminEmail}`);
    } else {
      toast.error(`EmailJS error: ${res.error ?? 'unknown'}`);
    }
  }

  async function onResyncCatalog() {
    if (
      !confirm(
        'Overwrite the bundled products, categories, banners and coupons in Firestore with the latest values from the app code? Items you added through the admin panel are NOT touched.',
      )
    ) {
      return;
    }
    setBusy(true);
    try {
      const counts = await resyncCatalogFromCode({
        products: seedProducts,
        categories: seedCategories,
        banners: seedBanners,
        coupons: seedCoupons,
      });
      toast.success(
        `Resynced — ${counts.products} products, ${counts.categories} categories, ${counts.banners} banners, ${counts.coupons} coupons updated.`,
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Resync failed');
    } finally {
      setBusy(false);
    }
  }

  async function testServerlessEmail() {
    if (!form.serverlessEmailUrl) {
      toast.error('Serverless email URL is empty');
      return;
    }
    if (!form.adminEmail) {
      toast.error('Set an admin email first');
      return;
    }
    const res = await sendEmailViaServerless(form, {
      to: form.adminEmail,
      subject: `Test email — ${form.brandName}`,
      html: `<p>Test ping from <b>${form.brandName}</b> via the bundled serverless email function. If you received this, your Resend integration is working.</p>`,
      fromName: form.brandName,
      replyTo: form.adminEmail,
    });
    if (res.ok) {
      toast.success(`Test email sent to ${form.adminEmail}`);
    } else {
      toast.error(`Serverless email error: ${res.error ?? 'unknown'}`);
    }
  }

  return (
    <>
      <Helmet><title>Settings — Admin</title></Helmet>
      <PageHeader
        icon={<FiSettings />}
        title="Site Settings"
        subtitle="Configure delivery charges, payment numbers, admin contacts, integrations and SEO."
        accent="violet"
        actions={
          <>
            <button onClick={reset} className="btn-outline text-xs">Reset to defaults</button>
            <button onClick={onSave} disabled={busy} className="btn-primary text-xs">
              <FiSave className="h-4 w-4" />
              {busy ? 'Saving…' : 'Save changes'}
            </button>
          </>
        }
      />

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Section
          title="Delivery charges"
          subtitle="Inside / outside Dhaka shipping fees. Customers see these as soon as they pick a delivery zone at checkout."
        >
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
          <div className="sm:col-span-2 flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={() => testWebhook('sms')}
              className="btn-outline text-xs"
            >
              <FiSend className="h-3.5 w-3.5" />
              Test SMS webhook
            </button>
            <button
              type="button"
              onClick={() => testWebhook('email')}
              className="btn-outline text-xs"
            >
              <FiSend className="h-3.5 w-3.5" />
              Test Email webhook
            </button>
          </div>
        </Section>

        <Section
          title="EmailJS (zero-config email)"
          subtitle="Send order emails directly from the browser via EmailJS — no backend required. Sign up at emailjs.com (free 200/mo), create a service + template with {{to_email}}, {{subject}}, {{message}}, {{html}} variables. Both admin and customer confirmation emails are sent."
        >
          <Field label="Service ID" placeholder="service_xxx" {...bind('emailJsServiceId')} />
          <Field label="Template ID" placeholder="template_xxx" {...bind('emailJsTemplateId')} />
          <Field label="Public key" placeholder="xxxxxx" {...bind('emailJsPublicKey')} />
          <div className="sm:col-span-2">
            <button
              type="button"
              onClick={testEmailJs}
              className="btn-outline text-xs"
            >
              <FiSend className="h-3.5 w-3.5" />
              Send test email to {form.adminEmail || 'admin'}
            </button>
            <p className="mt-2 text-[11px] text-slate-500">
              When configured, customers with email addresses will also receive an order confirmation email automatically.
            </p>
          </div>
        </Section>

        <Section
          title="Bundled serverless email (Resend)"
          subtitle="Easiest setup: drop a RESEND_API_KEY into your Vercel project env vars and order emails are sent via the bundled /api/send-email function. Optionally set RESEND_FROM_EMAIL (verified domain) and NOTIFY_SHARED_SECRET for extra protection."
        >
          <Field
            label="Endpoint URL"
            placeholder="/api/send-email"
            help="Defaults to the bundled function. Leave blank to disable."
            {...bind('serverlessEmailUrl')}
          />
          <Field
            label="Shared secret (optional)"
            placeholder="Match NOTIFY_SHARED_SECRET in Vercel env"
            {...bind('serverlessEmailToken')}
          />
          <div className="sm:col-span-2">
            <button
              type="button"
              onClick={testServerlessEmail}
              className="btn-outline text-xs"
            >
              <FiSend className="h-3.5 w-3.5" />
              Send test email via serverless to {form.adminEmail || 'admin'}
            </button>
            <p className="mt-2 text-[11px] text-slate-500">
              Get a free key at <a href="https://resend.com" target="_blank" rel="noreferrer" className="underline">resend.com</a>.
              Free tier covers 3,000 emails/month.
            </p>
          </div>
        </Section>

        <Section
          title="Direct SMS API"
          subtitle="Send SMS directly via a Bangladesh SMS gateway (e.g. BulkSMSBD, GreenWeb, ElitBuzz). This sends order notifications to both admin and customer phones. Leave empty to use webhook-only."
        >
          <Field label="API URL" placeholder="https://api.greenweb.com.bd/api.php" {...bind('smsApiUrl')} />
          <Field label="API Token / Key" placeholder="Your API token" {...bind('smsApiToken')} />
          <Field label="Sender ID (optional)" placeholder="e.g. AhmadCollection" {...bind('smsApiSenderId')} />
          <div className="sm:col-span-2">
            <button
              type="button"
              onClick={() => testSmsApi()}
              className="btn-outline text-xs"
            >
              <FiSend className="h-3.5 w-3.5" />
              Send test SMS to {form.adminSmsPhone || 'admin phone'}
            </button>
            <p className="mt-2 text-[11px] text-slate-500">
              Sends both admin and customer SMS on each order. Popular BD providers: GreenWeb, BulkSMSBD, ElitBuzz, SSLWireless.
            </p>
          </div>
        </Section>

        <Section
          title="Image upload"
          subtitle="ImgBB API key (free, no backend needed) for product / banner / category image uploads. Leave empty to fall back to Firebase Storage (requires Blaze plan + deployed storage.rules)."
        >
          <div className="sm:col-span-2">
            <Field
              label="ImgBB API key"
              placeholder="paste your free ImgBB API key"
              help="Get one in 30 seconds at https://api.imgbb.com (Sign up → API → Add). 32MB max per image, no monthly cap."
              {...bind('imgbbApiKey')}
            />
          </div>
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
          <div className="sm:col-span-2">
            <span className="label">Open Graph image (upload or paste URL)</span>
            <div className="mt-1">
              <ImageInput
                value={form.ogImage ?? ''}
                onChange={(url) => setForm((p) => ({ ...p, ogImage: url }))}
                folder="settings"
              />
            </div>
          </div>
        </Section>
      </div>

      <div className="card mt-6 border-emerald-200 bg-emerald-50/60 p-4 text-sm dark:border-emerald-500/30 dark:bg-emerald-500/10">
        <h2 className="font-display text-sm font-bold uppercase tracking-wider">Catalog data</h2>
        <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
          Pushes the bundled products, categories, banners and coupons from the app code into
          Firestore, overwriting the matching documents (by ID). Use this after a code update
          fixes images or copy on the seeded items. Items added through the admin panel keep
          their auto-generated IDs and are not affected.
        </p>
        <button
          type="button"
          onClick={onResyncCatalog}
          disabled={busy}
          className="btn-outline mt-3 text-xs"
        >
          <FiRefreshCw className="h-3.5 w-3.5" />
          Resync catalog from code
        </button>
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
    <div className="card relative overflow-hidden p-5">
      {/* Hairline gradient strip at the top — same brand→accent palette as
          the public storefront so the admin form sections feel like part
          of the same site. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-500 via-brand-400 to-accent-500"
      />
      <div className="mb-3">
        <h2 className="font-display text-base font-bold tracking-tight text-slate-800 dark:text-slate-100">
          {title}
        </h2>
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


