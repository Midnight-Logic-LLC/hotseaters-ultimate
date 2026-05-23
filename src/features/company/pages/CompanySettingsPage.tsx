/**
 * CompanySettingsPage — port of MVP `pages/Settings.jsx` (collapsed to v0.1
 * scope: Info + Branding + Team-link + Billing/Pipeline placeholders).
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */

import { useEffect, useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useCompanySettings } from '@/features/company/hooks/use-company-settings';
import { applyThemeVars } from '@/shared/lib/theme';

export function CompanySettingsPage() {
  const { companyId, isAuthenticated, isLoading } = useAuth();
  const { company, isLoading: loadingCompany, saving, error, save } =
    useCompanySettings(companyId);

  if (!isLoading && !isAuthenticated) return <Navigate to="/login" replace />;
  if (!isLoading && !companyId) return <Navigate to="/onboarding" replace />;

  return (
    <div style={{ padding: 'var(--theme-page-padding)' }}>
      <h1
        style={{
          fontFamily: 'var(--theme-font-brand-title)',
          fontSize: 'var(--theme-text-page-title)',
          color: 'var(--theme-stone-900)',
          margin: 0,
          marginBottom: '0.5rem',
        }}
      >
        Settings
      </h1>
      <p style={{ color: 'var(--theme-stone-500)', marginBottom: '1.5rem' }}>
        Manage your firm&rsquo;s details, branding, and team.
      </p>

      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">Firm Info</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          {loadingCompany || !company ? (
            <p>Loading…</p>
          ) : (
            <FirmInfoForm
              company={company}
              saving={saving}
              error={error}
              onSave={save}
            />
          )}
        </TabsContent>

        <TabsContent value="branding">
          {company && (
            <BrandingForm company={company} saving={saving} onSave={save} />
          )}
        </TabsContent>

        <TabsContent value="team">
          <Card>
            <CardHeader>
              <CardTitle>Team</CardTitle>
            </CardHeader>
            <CardContent>
              <p style={{ marginBottom: '1rem', color: 'var(--theme-stone-600)' }}>
                Manage members, invitations, and roles.
              </p>
              <Link to="/Team">
                <Button>Open Team page</Button>
              </Link>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing">
          <Placeholder
            title="Billing"
            body="Billing settings land in a future change."
          />
        </TabsContent>

        <TabsContent value="pipeline">
          <Placeholder
            title="Pipeline"
            body="Pipeline stages land with the deals feature."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Firm Info ─────────────────────────────────────────────────────────────

interface FirmInfoFormProps {
  company: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    website: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    zip: string | null;
  };
  saving: boolean;
  error: string | null;
  onSave: (patch: Record<string, unknown>) => Promise<void>;
}

function FirmInfoForm({ company, saving, error, onSave }: FirmInfoFormProps) {
  const [form, setForm] = useState({
    name: company.name ?? '',
    email: company.email ?? '',
    phone: company.phone ?? '',
    website: company.website ?? '',
    address: company.address ?? '',
    city: company.city ?? '',
    state: company.state ?? '',
    zip: company.zip ?? '',
  });

  useEffect(() => {
    setForm({
      name: company.name ?? '',
      email: company.email ?? '',
      phone: company.phone ?? '',
      website: company.website ?? '',
      address: company.address ?? '',
      city: company.city ?? '',
      state: company.state ?? '',
      zip: company.zip ?? '',
    });
  }, [company]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await onSave({
      name: form.name.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      website: form.website.trim() || null,
      address: form.address.trim() || null,
      city: form.city.trim() || null,
      state: form.state.trim() || null,
      zip: form.zip.trim() || null,
    });
  };

  const change = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Firm info</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <FieldRow label="Firm name" id="name" value={form.name} onChange={change('name')} required />
          <FieldRow label="Email" id="email" type="email" value={form.email} onChange={change('email')} />
          <FieldRow label="Phone" id="phone" type="tel" value={form.phone} onChange={change('phone')} />
          <FieldRow label="Website" id="website" type="url" value={form.website} onChange={change('website')} />
          <FieldRow label="Street address" id="address" value={form.address} onChange={change('address')} />
          <div className="grid grid-cols-3 gap-2">
            <FieldRow label="City" id="city" value={form.city} onChange={change('city')} />
            <FieldRow label="State" id="state" value={form.state} onChange={change('state')} />
            <FieldRow label="ZIP" id="zip" value={form.zip} onChange={change('zip')} />
          </div>
          <div>
            <Button type="submit" disabled={saving || !form.name.trim()}>
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
            {error && (
              <p role="alert" style={{ marginTop: '0.5rem', color: 'rgb(153, 27, 27)' }}>
                {error}
              </p>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

interface BrandingFormProps {
  company: { id: string; theme: Record<string, unknown> | null };
  saving: boolean;
  onSave: (patch: Record<string, unknown>) => Promise<void>;
}

function BrandingForm({ company, saving, onSave }: BrandingFormProps) {
  const initial = (company.theme ?? {}) as Record<string, unknown>;
  const [primary, setPrimary] = useState<string>(
    (initial.brand_primary as string | undefined) ?? '#2563eb',
  );

  const handlePreview = () => {
    applyThemeVars({ brand_primary: primary });
  };

  const handleSave = async () => {
    const nextTheme = { ...initial, brand_primary: primary };
    await onSave({ theme: nextTheme });
    applyThemeVars(nextTheme);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Branding</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="brand-primary">Brand primary color</Label>
            <div className="flex items-center gap-2">
              <Input
                id="brand-primary"
                type="color"
                value={primary}
                onChange={(e) => setPrimary(e.target.value)}
                className="h-10 w-16"
              />
              <Input
                aria-label="Brand primary hex"
                value={primary}
                onChange={(e) => setPrimary(e.target.value)}
                className="font-mono"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={handlePreview}>
              Preview
            </Button>
            <Button type="button" onClick={() => void handleSave()} disabled={saving}>
              {saving ? 'Saving…' : 'Save branding'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface FieldRowProps {
  label: string;
  id: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  required?: boolean;
}

function FieldRow({ label, id, value, onChange, type, required }: FieldRowProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} value={value} onChange={onChange} required={required} />
    </div>
  );
}

function Placeholder({ title, body }: { title: string; body: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p style={{ color: 'var(--theme-stone-500)' }}>{body}</p>
      </CardContent>
    </Card>
  );
}
