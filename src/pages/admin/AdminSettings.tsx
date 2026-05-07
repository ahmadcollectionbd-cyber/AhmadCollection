import { useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  FiSave,
  FiSend,
  FiRefreshCw,
  FiSettings,
  FiTrash2,
  FiPlus,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useSettingsStore } from '../../stores/settingsStore';
import {
  saveSettings,
  DEFAULT_SETTINGS,
  DEFAULT_MANGO_DELIVERY,
  DEFAULT_HOME_FEATURE_CARDS,
} from '../../lib/settings';
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
import type {
  HomeFeatureCard,
  HomeFeatureCardIcon,
  HomeFeatureCardPalette,
  SiteSettings,
} from '../../types';
import { ImageInput } from '../../components/ui/ImageInput';
import { PageHeader } from '../../components/admin/PageHeader';
import {
  BkashBrand,
  NagadBrand,
  BankBrand,
  CodBrand,
} from '../../components/payments/PaymentBrand';
import type { BankAccountDetails, PaymentMethodsEnabled } from '../../types';

type FormState = SiteSettings;
type SettingsTab = 'general' | 'payments' | 'apis';

export function AdminSettings() {
  const settings = useSettingsStore((s) => s.settings);
  const loaded = useSettingsStore((s) => s.loaded);
  const [form, setForm] = useState<FormState>(settings);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<SettingsTab>('general');
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

      <div className="mt-6 inline-flex w-full overflow-x-auto rounded-2xl border border-slate-200/70 bg-white/70 p-1 dark:border-white/10 dark:bg-slate-900/40">
        <TabButton current={tab} value="general" onChange={setTab}>
          General
        </TabButton>
        <TabButton current={tab} value="payments" onChange={setTab}>
          Payments
        </TabButton>
        <TabButton current={tab} value="apis" onChange={setTab}>
          APIs &amp; Integrations
        </TabButton>
      </div>

      {tab === 'general' && (
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Section
          title="Delivery charges"
          subtitle={`Customers see "Inside ${form.deliveryCityName || 'Dhaka'}" / "Outside ${form.deliveryCityName || 'Dhaka'}" at checkout. Change the city name to match your shop's base location.`}
        >
          <Field
            label="City name"
            placeholder="Dhaka"
            help="Shown on checkout — e.g. set to Khulna for an Inside Khulna / Outside Khulna split."
            {...bind('deliveryCityName')}
          />
          <div className="hidden sm:block" aria-hidden="true" />
          <Field
            label={`Inside ${form.deliveryCityName || 'Dhaka'} (BDT)`}
            type="number"
            {...bind('deliveryInside')}
          />
          <Field
            label={`Outside ${form.deliveryCityName || 'Dhaka'} (BDT)`}
            type="number"
            {...bind('deliveryOutside')}
          />
          <Field
            label="Free delivery above (BDT)"
            type="number"
            help="Set to 0 to always charge delivery."
            {...bind('freeDeliveryAbove')}
          />
        </Section>

        <MangoDeliverySection
          form={form}
          onChange={(patch) =>
            setForm((p) => ({
              ...p,
              mangoDelivery: { ...(p.mangoDelivery ?? DEFAULT_MANGO_DELIVERY), ...patch },
            }))
          }
        />

        <TopbarSection form={form} setForm={setForm} />

        <HomeFeatureCardsSection form={form} setForm={setForm} />

        <Section title="Admin contact" subtitle="Where new-order alerts are sent.">
          <Field label="Admin SMS phone (digits)" placeholder="+8801..." {...bind('adminSmsPhone')} />
          <Field label="Admin email" type="email" {...bind('adminEmail')} />
          <Field label="Public phone (E.164)" {...bind('contactPhone')} />
          <Field label="Public phone display" {...bind('contactPhoneDisplay')} />
          <Field label="Public WhatsApp number" placeholder="8801..." {...bind('whatsappNumber')} />
          <Field label="Messenger URL" {...bind('messengerUrl')} />
          <Field label="Support email" {...bind('supportEmail')} />
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
      )}

      {tab === 'payments' && (
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Section
          title="Payment methods"
          subtitle="Toggle each payment method on/off and configure the customer-facing details (bKash / Nagad numbers, bank account, COD)."
        >
          <PaymentMethodsCard form={form} setForm={setForm} />
        </Section>

        <AdvanceDeliveryFlowSection form={form} setForm={setForm} />

        <FoodCheckoutImageSection form={form} setForm={setForm} />
      </div>
      )}

      {tab === 'apis' && (
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
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

        <Section
          title="Tracking pixels"
          subtitle="Marketing analytics IDs — leave empty to disable. Meta Pixel powers Facebook ad retargeting; GA4 powers Google Analytics."
        >
          <Field label="Meta Pixel ID" placeholder="e.g. 123456789012345" {...bind('metaPixelId')} />
          <Field label="Google Analytics 4 ID" placeholder="G-XXXXXXX" {...bind('gaMeasurementId')} />
        </Section>
      </div>
      )}

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

const MANGO_ZONE_LABELS: { id: 'cityInside' | 'districtOutside' | 'upozila'; label: string }[] = [
  { id: 'cityInside', label: 'Dhaka City (Inside)' },
  { id: 'districtOutside', label: 'District / Outside Dhaka' },
  { id: 'upozila', label: 'Upozila / Sub-district' },
];

function MangoDeliverySection({
  form,
  onChange,
}: {
  form: SiteSettings;
  onChange: (patch: Partial<NonNullable<SiteSettings['mangoDelivery']>>) => void;
}) {
  const cfg = form.mangoDelivery ?? DEFAULT_MANGO_DELIVERY;
  return (
    <div className="card relative overflow-hidden p-5 xl:col-span-2">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-500"
      />
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-base font-bold tracking-tight text-slate-800 dark:text-slate-100">
            Mango / per-kg delivery (Steadfast)
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Used when the cart contains a per-kg food product. Customer picks zone + Point/Home at checkout.
          </p>
        </div>
        <label className="inline-flex items-center gap-2 text-sm font-semibold">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300"
            checked={cfg.enabled}
            onChange={(e) => onChange({ enabled: e.target.checked })}
          />
          {cfg.enabled ? 'Enabled' : 'Disabled'}
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          label="Weight threshold (kg)"
          type="number"
          help="Below this weight uses the lower row, on/above uses the upper row."
          value={cfg.weightThresholdKg}
          onChange={(e) => onChange({ weightThresholdKg: Math.max(1, Number(e.target.value) || 1) })}
        />
      </div>

      <div className="mt-3 rounded-2xl border border-amber-300/60 bg-amber-50/50 p-3 text-xs text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
        <div className="font-bold">Mango / food advance-delivery charge</div>
        <p className="mt-1">
          For food / mango lines the per-product / per-category
          <i> advance delivery charge</i> is replaced by an amount taken
          straight from this section, so the customer is never charged
          twice. Pick which amount the customer pays upfront via
          bKash / Nagad / Bank:
        </p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <label
            className={`flex cursor-pointer items-start gap-2 rounded-xl border p-2 ${
              !cfg.advanceFullShipping
                ? 'border-amber-500 bg-white/70 dark:bg-slate-900/40'
                : 'border-amber-200/60 dark:border-amber-500/20'
            }`}
          >
            <input
              type="radio"
              name="mango-advance-mode"
              className="mt-0.5 h-4 w-4"
              checked={!cfg.advanceFullShipping}
              onChange={() => onChange({ advanceFullShipping: false })}
            />
            <span>
              <b>Minimum charge only</b> (default). The minimum charge for
              the resolved zone + Point/Home is collected as advance. The
              rest of the per-kg shipping is paid as cash on delivery.
            </span>
          </label>
          <label
            className={`flex cursor-pointer items-start gap-2 rounded-xl border p-2 ${
              cfg.advanceFullShipping
                ? 'border-amber-500 bg-white/70 dark:bg-slate-900/40'
                : 'border-amber-200/60 dark:border-amber-500/20'
            }`}
          >
            <input
              type="radio"
              name="mango-advance-mode"
              className="mt-0.5 h-4 w-4"
              checked={!!cfg.advanceFullShipping}
              onChange={() => onChange({ advanceFullShipping: true })}
            />
            <span>
              <b>Full Steadfast shipping</b>. The entire mango / per-kg
              shipping fee is collected upfront; only the goods total
              is left as cash on delivery.
            </span>
          </label>
        </div>
      </div>

      {MANGO_ZONE_LABELS.map(({ id, label }) => {
        const zone = cfg.zones[id];
        const min = cfg.minimumCharge[id];
        return (
          <div
            key={id}
            className="mt-4 rounded-2xl border border-slate-200/70 bg-slate-50/60 p-3 dark:border-white/10 dark:bg-slate-900/40"
          >
            <div className="text-xs font-bold uppercase tracking-widest text-slate-500">{label}</div>
            <div className="mt-2 grid gap-2 sm:grid-cols-4">
              <NumField
                label={`Below ${cfg.weightThresholdKg}kg · Point (৳/kg)`}
                value={zone.belowThreshold.pointPerKg}
                onChange={(v) =>
                  onChange({
                    zones: {
                      ...cfg.zones,
                      [id]: {
                        ...zone,
                        belowThreshold: { ...zone.belowThreshold, pointPerKg: v },
                      },
                    },
                  })
                }
              />
              <NumField
                label={`Below ${cfg.weightThresholdKg}kg · Home (৳/kg)`}
                value={zone.belowThreshold.homePerKg}
                onChange={(v) =>
                  onChange({
                    zones: {
                      ...cfg.zones,
                      [id]: {
                        ...zone,
                        belowThreshold: { ...zone.belowThreshold, homePerKg: v },
                      },
                    },
                  })
                }
              />
              <NumField
                label={`${cfg.weightThresholdKg}kg+ · Point (৳/kg)`}
                value={zone.aboveThreshold.pointPerKg}
                onChange={(v) =>
                  onChange({
                    zones: {
                      ...cfg.zones,
                      [id]: {
                        ...zone,
                        aboveThreshold: { ...zone.aboveThreshold, pointPerKg: v },
                      },
                    },
                  })
                }
              />
              <NumField
                label={`${cfg.weightThresholdKg}kg+ · Home (৳/kg)`}
                value={zone.aboveThreshold.homePerKg}
                onChange={(v) =>
                  onChange({
                    zones: {
                      ...cfg.zones,
                      [id]: {
                        ...zone,
                        aboveThreshold: { ...zone.aboveThreshold, homePerKg: v },
                      },
                    },
                  })
                }
              />
            </div>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <NumField
                label="Minimum charge · Point (৳)"
                value={min.point ?? 0}
                onChange={(v) =>
                  onChange({
                    minimumCharge: { ...cfg.minimumCharge, [id]: { ...min, point: v } },
                  })
                }
              />
              <NumField
                label="Minimum charge · Home (৳)"
                value={min.home ?? 0}
                onChange={(v) =>
                  onChange({
                    minimumCharge: { ...cfg.minimumCharge, [id]: { ...min, home: v } },
                  })
                }
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function FoodCheckoutImageSection({
  form,
  setForm,
}: {
  form: SiteSettings;
  setForm: React.Dispatch<React.SetStateAction<SiteSettings>>;
}) {
  return (
    <div className="card relative overflow-hidden p-5 xl:col-span-2">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-500 via-orange-400 to-rose-500"
      />
      <div className="mb-3">
        <h2 className="font-display text-base font-bold tracking-tight text-slate-800 dark:text-slate-100">
          Food / mango checkout image
        </h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Shown ONLY on the checkout page when the cart contains a food / mango
          line. Use it to explain the courier payment process visually
          (screenshot of bKash send-money, Steadfast slip, etc.). Leave the
          image empty to hide the section.
        </p>
      </div>
      <div className="grid gap-3">
        <div>
          <span className="label">Image</span>
          <div className="mt-1">
            <ImageInput
              value={form.foodCheckoutImage ?? ''}
              onChange={(url) => setForm((p) => ({ ...p, foodCheckoutImage: url }))}
              folder="settings"
            />
          </div>
        </div>
        <label className="block">
          <span className="label">Caption (English)</span>
          <textarea
            className="input mt-1 min-h-[64px]"
            value={form.foodCheckoutImageNote ?? ''}
            onChange={(e) =>
              setForm((p) => ({ ...p, foodCheckoutImageNote: e.target.value }))
            }
            placeholder="e.g. Courier payment process — please review before placing your food / mango order."
          />
        </label>
        <label className="block">
          <span className="label">Caption (বাংলা)</span>
          <textarea
            className="input mt-1 min-h-[64px] font-bn"
            value={form.foodCheckoutImageNoteBn ?? ''}
            onChange={(e) =>
              setForm((p) => ({ ...p, foodCheckoutImageNoteBn: e.target.value }))
            }
            placeholder="যেমন: কুরিয়ার পেমেন্ট প্রক্রিয়া — খাবার / আম অর্ডার করার আগে দেখে নিন।"
          />
        </label>
      </div>
    </div>
  );
}

const DEFAULT_ADVANCE_FLOW = {
  enabled: false,
  noticeText:
    'To confirm your order, the delivery charge must be paid in advance — the rest is cash on delivery.',
  noticeTextBn:
    'আপনার অর্ডার কনফার্ম করতে ডেলিভারি চার্জটি অগ্রিম পরিশোধ করতে হবে, বাকিটা ক্যাশ অন ডেলিভারি।',
  payLaterText:
    'To confirm your order, our representative will quickly call you to confirm. You can pay then.',
  payLaterTextBn:
    'অর্ডার কনফার্ম করতে আমাদের প্রতিনিধি দ্রুত আপনাকে কল করে কনফার্ম করবেন, আপনি তখন পেমেন্ট করতে পারবেন।',
};

function AdvanceDeliveryFlowSection({
  form,
  setForm,
}: {
  form: SiteSettings;
  setForm: React.Dispatch<React.SetStateAction<SiteSettings>>;
}) {
  const cfg = form.advanceDeliveryFlow ?? DEFAULT_ADVANCE_FLOW;
  function patch(p: Partial<NonNullable<SiteSettings['advanceDeliveryFlow']>>) {
    setForm((s) => ({
      ...s,
      advanceDeliveryFlow: { ...DEFAULT_ADVANCE_FLOW, ...cfg, ...p },
    }));
  }
  return (
    <div className="card relative overflow-hidden p-5 xl:col-span-2">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-cyan-400 to-violet-500"
      />
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-base font-bold tracking-tight text-slate-800 dark:text-slate-100">
            Advance delivery flow (Pay Now / Pay Later)
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            When enabled and the order requires an advance delivery charge,
            the customer can pick "Pay now online" (existing payment gateway)
            or "Pay later" (representative call back). Notes are shown to the
            customer above each choice — fully editable below.
          </p>
        </div>
        <label className="inline-flex items-center gap-2 text-sm font-semibold">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300"
            checked={!!cfg.enabled}
            onChange={(e) => patch({ enabled: e.target.checked })}
          />
          {cfg.enabled ? 'Enabled' : 'Disabled'}
        </label>
      </div>

      <div className="grid gap-3">
        <label className="block">
          <span className="label">Advance notice (English)</span>
          <textarea
            className="input mt-1 min-h-[72px]"
            value={cfg.noticeText}
            onChange={(e) => patch({ noticeText: e.target.value })}
            placeholder="To confirm your order, the delivery charge must be paid in advance…"
          />
        </label>
        <label className="block">
          <span className="label">Advance notice (বাংলা)</span>
          <textarea
            className="input mt-1 min-h-[72px] font-bn"
            value={cfg.noticeTextBn}
            onChange={(e) => patch({ noticeTextBn: e.target.value })}
            placeholder="অর্ডার কনফার্ম করতে ডেলিভারি চার্জটি অগ্রিম পরিশোধ করতে হবে…"
          />
        </label>
        <label className="block">
          <span className="label">"Pay later" note (English)</span>
          <textarea
            className="input mt-1 min-h-[72px]"
            value={cfg.payLaterText}
            onChange={(e) => patch({ payLaterText: e.target.value })}
            placeholder="To confirm your order, our representative will quickly call you to confirm…"
          />
        </label>
        <label className="block">
          <span className="label">"Pay later" note (বাংলা)</span>
          <textarea
            className="input mt-1 min-h-[72px] font-bn"
            value={cfg.payLaterTextBn}
            onChange={(e) => patch({ payLaterTextBn: e.target.value })}
            placeholder="অর্ডার কনফার্ম করতে আমাদের প্রতিনিধি দ্রুত আপনাকে কল করে কনফার্ম করবেন…"
          />
        </label>
      </div>
    </div>
  );
}

function NumField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <span className="text-[11px] text-slate-500">{label}</span>
      <input
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
        className="input mt-0.5 h-9 py-1.5 text-xs"
      />
    </label>
  );
}

const DEFAULT_PAYMENT_TOGGLES: PaymentMethodsEnabled = {
  bkash: true,
  nagad: true,
  bank: false,
  cod: true,
};

function PaymentMethodsCard({
  form,
  setForm,
}: {
  form: SiteSettings;
  setForm: React.Dispatch<React.SetStateAction<SiteSettings>>;
}) {
  const toggles = form.paymentMethodsEnabled ?? DEFAULT_PAYMENT_TOGGLES;
  const bank: BankAccountDetails =
    form.bankAccount ?? {
      bankName: '',
      accountName: '',
      accountNumber: '',
      branch: '',
      routingNumber: '',
    };

  function patchToggles(p: Partial<PaymentMethodsEnabled>) {
    setForm((s) => ({
      ...s,
      paymentMethodsEnabled: { ...toggles, ...p },
    }));
  }
  function patchBank(p: Partial<BankAccountDetails>) {
    setForm((s) => ({
      ...s,
      bankAccount: { ...bank, ...p },
    }));
  }

  const rows: {
    key: keyof PaymentMethodsEnabled;
    badge: React.ReactNode;
    label: string;
    help?: string;
  }[] = [
    {
      key: 'bkash',
      badge: <BkashBrand size={28} />,
      label: 'bKash (Personal)',
      help: 'Customer pays manually to your personal bKash, then enters tx ID.',
    },
    {
      key: 'nagad',
      badge: <NagadBrand size={28} />,
      label: 'Nagad (Personal)',
      help: 'Customer pays manually to your personal Nagad, then enters tx ID.',
    },
    {
      key: 'bank',
      badge: <BankBrand size={28} />,
      label: 'Bank transfer',
      help: 'Customer transfers via bank/online banking, then enters tx ID.',
    },
    {
      key: 'cod',
      badge: <CodBrand size={28} />,
      label: 'Cash on delivery',
      help: 'Customer pays the courier on delivery. Disabled automatically when an advance charge is required.',
    },
  ];

  return (
    <div className="sm:col-span-2 grid gap-3">
      <ul className="grid gap-2">
        {rows.map((r) => (
          <li
            key={r.key}
            className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200/70 bg-white/70 p-3 dark:border-white/10 dark:bg-slate-900/40"
          >
            <div className="shrink-0">{r.badge}</div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold">{r.label}</div>
              {r.help && <p className="text-[11px] text-slate-500">{r.help}</p>}
            </div>
            <label className="inline-flex shrink-0 items-center gap-2 text-xs font-semibold">
              <input
                type="checkbox"
                checked={!!toggles[r.key]}
                onChange={(e) => patchToggles({ [r.key]: e.target.checked } as Partial<PaymentMethodsEnabled>)}
                className="h-4 w-4 rounded border-slate-300"
              />
              {toggles[r.key] ? 'Enabled' : 'Disabled'}
            </label>
          </li>
        ))}
      </ul>

      <div className="grid gap-3 rounded-2xl border border-slate-200/70 bg-white/70 p-3 sm:grid-cols-2 dark:border-white/10 dark:bg-slate-900/40">
        <div className="sm:col-span-2 text-xs uppercase tracking-widest text-slate-500">
          bKash / Nagad numbers
        </div>
        <label className="block">
          <span className="label">bKash personal number</span>
          <input
            className="input mt-1"
            value={form.bkashNumber}
            onChange={(e) => setForm((s) => ({ ...s, bkashNumber: e.target.value }))}
            placeholder="01XXXXXXXXX"
          />
        </label>
        <label className="block">
          <span className="label">Nagad personal number</span>
          <input
            className="input mt-1"
            value={form.nagadNumber}
            onChange={(e) => setForm((s) => ({ ...s, nagadNumber: e.target.value }))}
            placeholder="01XXXXXXXXX"
          />
        </label>
      </div>

      <div
        className={
          'grid gap-3 rounded-2xl border p-3 sm:grid-cols-2 ' +
          (toggles.bank
            ? 'border-blue-200/70 bg-blue-50/40 dark:border-blue-500/20 dark:bg-blue-500/5'
            : 'border-slate-200/70 bg-white/40 opacity-70 dark:border-white/10 dark:bg-slate-900/40')
        }
      >
        <div className="sm:col-span-2 flex items-center justify-between gap-2">
          <span className="text-xs uppercase tracking-widest text-slate-500">
            Bank transfer details
          </span>
          {!toggles.bank && (
            <span className="text-[11px] text-slate-400">Method disabled — fields hidden on Checkout.</span>
          )}
        </div>
        <label className="block">
          <span className="label">Bank name</span>
          <input
            className="input mt-1"
            value={bank.bankName}
            onChange={(e) => patchBank({ bankName: e.target.value })}
            placeholder="e.g. Dutch-Bangla Bank"
          />
        </label>
        <label className="block">
          <span className="label">Account name</span>
          <input
            className="input mt-1"
            value={bank.accountName}
            onChange={(e) => patchBank({ accountName: e.target.value })}
            placeholder="Account holder name"
          />
        </label>
        <label className="block">
          <span className="label">Account number</span>
          <input
            className="input mt-1"
            value={bank.accountNumber}
            onChange={(e) => patchBank({ accountNumber: e.target.value })}
            placeholder="0000-0000-0000"
          />
        </label>
        <label className="block">
          <span className="label">Branch</span>
          <input
            className="input mt-1"
            value={bank.branch ?? ''}
            onChange={(e) => patchBank({ branch: e.target.value })}
            placeholder="e.g. Mirpur Branch"
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="label">Routing number (optional)</span>
          <input
            className="input mt-1"
            value={bank.routingNumber ?? ''}
            onChange={(e) => patchBank({ routingNumber: e.target.value })}
            placeholder="9 digits, used for online transfers"
          />
        </label>
      </div>
    </div>
  );
}

function TabButton({
  current,
  value,
  onChange,
  children,
}: {
  current: SettingsTab;
  value: SettingsTab;
  onChange: (v: SettingsTab) => void;
  children: React.ReactNode;
}) {
  const active = current === value;
  return (
    <button
      type="button"
      onClick={() => onChange(value)}
      className={
        'flex-1 whitespace-nowrap rounded-xl px-4 py-2 text-xs font-semibold transition sm:text-sm ' +
        (active
          ? 'bg-brand-500 text-white shadow'
          : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800')
      }
    >
      {children}
    </button>
  );
}

const DEFAULT_TOPBAR = {
  enabled: true,
  text: 'Free delivery on orders above ৳{free}',
  textBn: '৳{free}+ অর্ডারে ফ্রি ডেলিভারি',
};

function TopbarSection({
  form,
  setForm,
}: {
  form: SiteSettings;
  setForm: React.Dispatch<React.SetStateAction<SiteSettings>>;
}) {
  const cfg = form.topbar ?? DEFAULT_TOPBAR;
  function patch(p: Partial<NonNullable<SiteSettings['topbar']>>) {
    setForm((s) => ({ ...s, topbar: { ...DEFAULT_TOPBAR, ...cfg, ...p } }));
  }
  return (
    <div className="card relative overflow-hidden p-5 xl:col-span-2">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-brand-400 to-cyan-500"
      />
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-base font-bold tracking-tight text-slate-800 dark:text-slate-100">
            Top announcement bar
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            The thin green strip above the main navigation. Use the placeholder{' '}
            <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">{'{free}'}</code>{' '}
            to insert the free-delivery threshold from the Delivery section.
            Toggle off to hide the bar entirely.
          </p>
        </div>
        <label className="inline-flex items-center gap-2 text-sm font-semibold">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300"
            checked={cfg.enabled !== false}
            onChange={(e) => patch({ enabled: e.target.checked })}
          />
          {cfg.enabled !== false ? 'Visible' : 'Hidden'}
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="label">Message (English)</span>
          <input
            className="input mt-1"
            value={cfg.text}
            onChange={(e) => patch({ text: e.target.value })}
            placeholder="Free delivery on orders above ৳{free}"
          />
        </label>
        <label className="block">
          <span className="label">Message (বাংলা)</span>
          <input
            className="input mt-1 font-bn"
            value={cfg.textBn ?? ''}
            onChange={(e) => patch({ textBn: e.target.value })}
            placeholder="৳{free}+ অর্ডারে ফ্রি ডেলিভারি"
          />
        </label>
      </div>
    </div>
  );
}

const PALETTE_OPTIONS: { value: HomeFeatureCardPalette; label: string }[] = [
  { value: 'brand', label: 'Brand (green)' },
  { value: 'amber', label: 'Amber' },
  { value: 'emerald', label: 'Emerald' },
  { value: 'rose', label: 'Rose' },
  { value: 'violet', label: 'Violet' },
  { value: 'sky', label: 'Sky' },
];

const ICON_OPTIONS: { value: HomeFeatureCardIcon; label: string }[] = [
  { value: 'percent', label: 'Percent (%)' },
  { value: 'shield', label: 'Shield' },
  { value: 'truck', label: 'Truck' },
  { value: 'gift', label: 'Gift' },
  { value: 'star', label: 'Star' },
  { value: 'heart', label: 'Heart' },
];

function HomeFeatureCardsSection({
  form,
  setForm,
}: {
  form: SiteSettings;
  setForm: React.Dispatch<React.SetStateAction<SiteSettings>>;
}) {
  const cards = form.homeFeatureCards ?? DEFAULT_HOME_FEATURE_CARDS();

  function commit(next: HomeFeatureCard[]) {
    setForm((s) => ({ ...s, homeFeatureCards: next }));
  }

  function patchCard(idx: number, patch: Partial<HomeFeatureCard>) {
    commit(cards.map((c, i) => (i === idx ? { ...c, ...patch } : c)));
  }

  function removeCard(idx: number) {
    if (!confirm('Remove this card?')) return;
    commit(cards.filter((_, i) => i !== idx));
  }

  function addCard() {
    const fresh: HomeFeatureCard = {
      id: `card-${Date.now()}`,
      enabled: true,
      badge: 'New',
      badgeBn: 'নতুন',
      title: 'New offer',
      titleBn: 'নতুন অফার',
      subtitle: 'Tell customers what makes this special.',
      subtitleBn: 'গ্রাহকদের জানান কী বিশেষ।',
      ctaText: 'Shop now',
      ctaTextBn: 'কিনুন',
      link: '/shop',
      palette: 'brand',
      icon: 'gift',
    };
    commit([...cards, fresh]);
  }

  return (
    <div className="card relative overflow-hidden p-5 xl:col-span-2">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-500 via-rose-500 to-violet-500"
      />
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-base font-bold tracking-tight text-slate-800 dark:text-slate-100">
            Home feature cards
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            The two coloured cards on the home page (originally "Free delivery
            / Save up to 25%" and "Quality Promise"). Edit copy, swap the icon
            and palette, change the link target or hide a card without
            removing it.
          </p>
        </div>
        <button type="button" onClick={addCard} className="btn-outline text-xs">
          <FiPlus className="h-3.5 w-3.5" /> Add card
        </button>
      </div>

      <div className="grid gap-4">
        {cards.map((card, idx) => (
          <div
            key={card.id}
            className="rounded-2xl border border-slate-200/70 bg-slate-50/60 p-4 dark:border-white/10 dark:bg-slate-900/40"
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Card {idx + 1}
              </div>
              <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-2 text-xs font-semibold">
                  <input
                    type="checkbox"
                    checked={card.enabled !== false}
                    onChange={(e) => patchCard(idx, { enabled: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  {card.enabled !== false ? 'Shown' : 'Hidden'}
                </label>
                <button
                  type="button"
                  onClick={() => removeCard(idx)}
                  className="rounded-lg p-1.5 text-accent-500 hover:bg-accent-500/10"
                  title="Remove card"
                >
                  <FiTrash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="label">Badge (English)</span>
                <input
                  className="input mt-1"
                  value={card.badge}
                  onChange={(e) => patchCard(idx, { badge: e.target.value })}
                  placeholder="Free delivery"
                />
              </label>
              <label className="block">
                <span className="label">Badge (বাংলা)</span>
                <input
                  className="input mt-1 font-bn"
                  value={card.badgeBn ?? ''}
                  onChange={(e) => patchCard(idx, { badgeBn: e.target.value })}
                  placeholder="ফ্রি ডেলিভারি"
                />
              </label>
              <label className="block">
                <span className="label">Title (English)</span>
                <input
                  className="input mt-1"
                  value={card.title}
                  onChange={(e) => patchCard(idx, { title: e.target.value })}
                  placeholder="Save up to 25%"
                />
              </label>
              <label className="block">
                <span className="label">Title (বাংলা)</span>
                <input
                  className="input mt-1 font-bn"
                  value={card.titleBn ?? ''}
                  onChange={(e) => patchCard(idx, { titleBn: e.target.value })}
                  placeholder="২৫% পর্যন্ত সাশ্রয়"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="label">Subtitle (English)</span>
                <textarea
                  className="input mt-1 min-h-[60px]"
                  value={card.subtitle}
                  onChange={(e) => patchCard(idx, { subtitle: e.target.value })}
                  placeholder="On premium honey, ghee, and mustard oil — limited time only."
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="label">Subtitle (বাংলা)</span>
                <textarea
                  className="input mt-1 min-h-[60px] font-bn"
                  value={card.subtitleBn ?? ''}
                  onChange={(e) => patchCard(idx, { subtitleBn: e.target.value })}
                  placeholder="প্রিমিয়াম মধু, ঘি এবং সরিষার তেলে — সীমিত সময়ের জন্য।"
                />
              </label>
              <label className="block">
                <span className="label">CTA text (English)</span>
                <input
                  className="input mt-1"
                  value={card.ctaText}
                  onChange={(e) => patchCard(idx, { ctaText: e.target.value })}
                  placeholder="Shop now"
                />
              </label>
              <label className="block">
                <span className="label">CTA text (বাংলা)</span>
                <input
                  className="input mt-1 font-bn"
                  value={card.ctaTextBn ?? ''}
                  onChange={(e) => patchCard(idx, { ctaTextBn: e.target.value })}
                  placeholder="কিনুন"
                />
              </label>
              <label className="block">
                <span className="label">Link target</span>
                <input
                  className="input mt-1"
                  value={card.link}
                  onChange={(e) => patchCard(idx, { link: e.target.value })}
                  placeholder="/shop"
                />
              </label>
              <label className="block">
                <span className="label">Palette</span>
                <select
                  className="input mt-1"
                  value={card.palette}
                  onChange={(e) =>
                    patchCard(idx, { palette: e.target.value as HomeFeatureCardPalette })
                  }
                >
                  {PALETTE_OPTIONS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="label">Icon</span>
                <select
                  className="input mt-1"
                  value={card.icon}
                  onChange={(e) =>
                    patchCard(idx, { icon: e.target.value as HomeFeatureCardIcon })
                  }
                >
                  {ICON_OPTIONS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        ))}
        {cards.length === 0 && (
          <p className="text-xs text-slate-500">
            No cards configured — the home page will hide this section.
          </p>
        )}
      </div>
    </div>
  );
}


