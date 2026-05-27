/**
 * theme-settings-tab.tsx — admin-only theme editor for `company.theme`.
 *
 * Bible parity: `HotSeatersMVP/src/components/settings/ThemeManagement.jsx`.
 * Architecturally simplified for the port — the bible interleaves preview
 * markup with controls. Here we render the full ~80-token grid first
 * (grouped) and provide live preview by writing each `--theme-*` variable
 * directly onto `document.documentElement` on every change, so existing
 * theme-driven surfaces (cards, buttons, sidebar, tabs) re-render with
 * the new values without a remount.
 *
 * Components → hooks only (RULE B). All persistence flows through
 * `useCompanySettings().saveSettings({ theme })`. Admin-only gating is
 * applied by the settings registry that mounts this tab (S14); this
 * component does not duplicate the gate.
 *
 * Buttons:
 *   - Save        → saveSettings({ theme: { tokens: currentValues } })
 *   - Reset       → restore THEME_TOKENS defaults + persist
 *   - Export JSON → download `{ tokens: currentValues }` as a JSON file
 *   - Import JSON → read JSON file, apply tokens (does not auto-save)
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */

import {
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from 'react';
import { Download, RotateCcw, Upload } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { useTier1 } from '@/app/tier1-provider';
import { useCompanySettings } from '@/features/company/hooks/use-company-settings';
import { applyThemeVars, DEFAULT_THEME } from '@/shared/lib/theme';
import {
  THEME_TOKENS,
  THEME_TOKEN_GROUPS,
  defaultTokenValues,
  type ThemeToken,
} from '@/shared/lib/theme-tokens';

const LABEL_STYLE = {
  fontSize: 'var(--theme-text-label)',
  color: 'var(--theme-stone-700)',
} as const;

const INPUT_STYLE = {
  borderRadius: 'var(--theme-input-radius)',
  borderWidth: 'var(--theme-input-border)',
  backgroundColor: 'var(--theme-input-bg)',
} as const;

/**
 * Live-preview helper — writes a single `--theme-*` variable onto
 * `document.documentElement` so dependent surfaces re-style immediately.
 * Safe in non-DOM test environments via the `typeof document` guard.
 */
function setThemeVar(key: string, value: string): void {
  if (typeof document === 'undefined') return;
  document.documentElement.style.setProperty(`--${key}`, value);
}

function isColorish(value: string): boolean {
  return /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value.trim());
}

function downloadJson(filename: string, payload: unknown): void {
  if (typeof document === 'undefined') return;
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

interface TokenControlProps {
  token: ThemeToken;
  value: string;
  onChange: (next: string) => void;
}

function TokenControl({ token, value, onChange }: TokenControlProps) {
  const showColorPicker = token.type === 'color' && isColorish(value);
  return (
    <div>
      <Label htmlFor={token.key} style={LABEL_STYLE}>
        {token.label}
      </Label>
      <div className="flex mt-1" style={{ gap: 'var(--theme-element-gap)' }}>
        {showColorPicker ? (
          <Input
            id={`${token.key}-color`}
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-16 h-10 p-1 cursor-pointer"
            aria-label={`${token.label} color picker`}
          />
        ) : null}
        <Input
          id={token.key}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1"
          style={INPUT_STYLE}
          placeholder={token.default}
        />
      </div>
      <p
        style={{
          fontSize: 'var(--theme-text-caption)',
          color: 'var(--theme-stone-500)',
          marginTop: 'var(--theme-element-gap)',
        }}
      >
        --{token.key}
      </p>
    </div>
  );
}

export function ThemeSettingsTab() {
  const { company: tier1Company } = useTier1();
  const companyId = tier1Company?.id ?? null;
  const {
    company,
    saving,
    saveSettings,
  } = useCompanySettings(companyId);

  // Seed initial token values from `company.theme.tokens` if present,
  // otherwise fall back to the catalog defaults.
  const initialValues = useMemo<Record<string, string>>(() => {
    const persisted = (company?.theme as
      | { tokens?: Record<string, string> }
      | null
      | undefined)?.tokens;
    if (persisted && typeof persisted === 'object') {
      const defaults = defaultTokenValues();
      return { ...defaults, ...persisted };
    }
    return defaultTokenValues();
  }, [company?.theme]);

  const [values, setValues] = useState<Record<string, string>>(initialValues);
  const [hydratedFromCompanyId, setHydratedFromCompanyId] = useState<
    string | null
  >(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Re-seed once the live company row arrives (mirrors company-settings-tab).
  if (company && hydratedFromCompanyId !== company.id) {
    setValues(initialValues);
    setHydratedFromCompanyId(company.id);
  }

  const handleTokenChange = (key: string, next: string) => {
    setValues((prev) => ({ ...prev, [key]: next }));
    setThemeVar(key, next);
  };

  const handleReset = async () => {
    const defaults = defaultTokenValues();
    setValues(defaults);
    // Use the high-level helper to restore the *full* canonical theme,
    // including any vars not surfaced as editable tokens.
    applyThemeVars(DEFAULT_THEME);
    await saveSettings({
      // Persist as the structured payload the bible writes back to
      // `company.theme`. The `tokens` map is the editor's authoritative
      // surface; downstream resolution favours it over legacy fields.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      theme: { tokens: defaults } as any,
    } as Parameters<typeof saveSettings>[0]);
  };

  const handleSave = async () => {
    await saveSettings({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      theme: { tokens: values } as any,
    } as Parameters<typeof saveSettings>[0]);
  };

  const handleExport = () => {
    downloadJson('company-theme.json', { tokens: values });
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as { tokens?: Record<string, unknown> };
      const incoming = parsed?.tokens;
      if (!incoming || typeof incoming !== 'object') return;
      const next: Record<string, string> = { ...values };
      for (const token of THEME_TOKENS) {
        const raw = (incoming as Record<string, unknown>)[token.key];
        if (typeof raw === 'string') {
          next[token.key] = raw;
          setThemeVar(token.key, raw);
        }
      }
      setValues(next);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const tokensByGroup = useMemo(() => {
    const map = new Map<string, ThemeToken[]>();
    for (const group of THEME_TOKEN_GROUPS) map.set(group, []);
    for (const t of THEME_TOKENS) map.get(t.group)?.push(t);
    return map;
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--theme-section-gap)',
      }}
    >
      <Card className="overflow-hidden">
        <CardHeader
          style={{
            backgroundColor: 'var(--theme-card-header-bg)',
            padding: 'var(--theme-card-header-padding)',
          }}
        >
          <div className="flex items-center justify-between flex-wrap" style={{ gap: 'var(--theme-element-gap)' }}>
            <CardTitle
              style={{
                fontSize: 'var(--theme-text-card-title)',
                color: 'var(--theme-stone-900)',
              }}
            >
              Theme
            </CardTitle>
            <div className="flex flex-wrap items-center" style={{ gap: 'var(--theme-element-gap)' }}>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleExport}
                aria-label="Export theme JSON"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleImportClick}
                aria-label="Import theme JSON"
              >
                <Upload className="w-4 h-4 mr-2" />
                Import
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json"
                className="hidden"
                onChange={handleImportFile}
                aria-label="Theme JSON file"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleReset}
                aria-label="Reset to defaults"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset to Defaults
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent style={{ padding: 'var(--theme-card-padding)' }}>
          <p
            style={{
              fontSize: 'var(--theme-text-body)',
              color: 'var(--theme-stone-600)',
              marginBottom: 'var(--theme-card-gap)',
            }}
          >
            Edit any of the theme tokens below. Changes preview live; click
            “Save Theme” to persist them to your company. Use Export/Import
            to back up or share a theme as JSON.
          </p>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--theme-section-gap)',
            }}
          >
            {THEME_TOKEN_GROUPS.map((group) => {
              const groupTokens = tokensByGroup.get(group) ?? [];
              return (
                <section
                  key={group}
                  aria-labelledby={`theme-group-${group}`}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--theme-card-gap)',
                  }}
                >
                  <h3
                    id={`theme-group-${group}`}
                    style={{
                      fontSize: 'var(--theme-text-section-title)',
                      color: 'var(--theme-stone-900)',
                      fontWeight: 600,
                    }}
                  >
                    {group}
                  </h3>
                  <div
                    className="grid md:grid-cols-2 lg:grid-cols-3"
                    style={{ gap: 'var(--theme-card-gap)' }}
                  >
                    {groupTokens.map((token) => (
                      <TokenControl
                        key={token.key}
                        token={token}
                        value={values[token.key] ?? token.default}
                        onChange={(next) => handleTokenChange(token.key, next)}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div
        className="flex justify-end"
        style={{ marginTop: 'var(--theme-section-gap)' }}
      >
        <Button
          onClick={handleSave}
          disabled={saving}
          style={{
            backgroundColor: 'var(--theme-brand-primary)',
            color: 'white',
          }}
          className="hover:opacity-90 transition-opacity"
        >
          {saving ? 'Saving...' : 'Save Theme'}
        </Button>
      </div>
    </div>
  );
}

export default ThemeSettingsTab;
