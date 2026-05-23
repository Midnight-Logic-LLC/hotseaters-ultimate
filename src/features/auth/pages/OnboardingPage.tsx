/**
 * OnboardingPage — single-step "tell us about your firm" form. Ported from
 * `HotSeatersMVP/src/pages/Onboarding.jsx` + `OnboardingWizard` (Step1BasicInfo
 * / StepCompanyInfo) — collapsed to the essentials needed to bootstrap a
 * tenant in v0.1. Multi-step wizard (services, tiers, pipeline, billing)
 * remains a v0.2 enhancement once those features land.
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */

import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { AuthCard } from '@/features/auth/components/AuthCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useOnboarding } from '@/features/auth/hooks/use-onboarding';
import { buildSeedCompanyRow } from '@/features/company/business-rules/seed-company';

export function OnboardingPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, companyId } = useAuth();
  const { submit, submitting, error } = useOnboarding();

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [stateCode, setStateCode] = useState('');
  const [zip, setZip] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isLoading && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (companyId) {
    return <Navigate to="/Dashboard" replace />;
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setValidationError(null);

    let row;
    try {
      row = buildSeedCompanyRow({
        name,
        address,
        city,
        state: stateCode,
        zip,
        phone,
        website,
      });
    } catch (err) {
      setValidationError(err instanceof Error ? err.message : 'Invalid input');
      return;
    }

    try {
      await submit(row);
      navigate('/Dashboard', { replace: true });
    } catch {
      // error surfaced via hook state
    }
  };

  return (
    <AuthCard
      title="Set up your firm"
      subtitle="A few details about your firm to get you started."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <Field
          label="Firm name *"
          id="name"
          value={name}
          onChange={setName}
          required
          autoComplete="organization"
        />
        <Field
          label="Phone"
          id="phone"
          value={phone}
          onChange={setPhone}
          type="tel"
          autoComplete="tel"
        />
        <Field
          label="Website"
          id="website"
          value={website}
          onChange={setWebsite}
          type="url"
          autoComplete="url"
          placeholder="https://"
        />
        <Field
          label="Street address"
          id="address"
          value={address}
          onChange={setAddress}
          autoComplete="street-address"
        />
        <div className="grid grid-cols-3 gap-2">
          <Field
            label="City"
            id="city"
            value={city}
            onChange={setCity}
            autoComplete="address-level2"
          />
          <Field
            label="State"
            id="state"
            value={stateCode}
            onChange={setStateCode}
            autoComplete="address-level1"
          />
          <Field
            label="ZIP"
            id="zip"
            value={zip}
            onChange={setZip}
            autoComplete="postal-code"
          />
        </div>

        <Button
          type="submit"
          disabled={submitting || !name.trim()}
          className="h-11 w-full justify-center"
          style={{
            borderRadius: 'var(--theme-button-radius)',
            backgroundColor: 'var(--theme-brand-primary)',
            color: '#fff',
          }}
        >
          {submitting ? 'Creating your firm…' : 'Create firm and continue'}
        </Button>

        {(validationError || error) && (
          <p role="alert" style={{ color: 'rgb(153, 27, 27)', fontSize: 'var(--theme-text-caption)' }}>
            {validationError ?? error}
          </p>
        )}
      </form>
    </AuthCard>
  );
}

interface FieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  autoComplete?: string;
  placeholder?: string;
}

function Field({
  id,
  label,
  value,
  onChange,
  type = 'text',
  required,
  autoComplete,
  placeholder,
}: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        autoComplete={autoComplete}
        placeholder={placeholder}
      />
    </div>
  );
}
