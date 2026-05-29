/**
 * add-contact-wizard.tsx — port of
 * HotSeatersMVP/src/components/sales/AddContactWizard.jsx.
 *
 * Two-/three-step "Add Contact" wizard for the Deal Tracker:
 *   Step 1 — Find or Create Contact (search existing attorneys by name).
 *   Step 2 — Create New Contact & Firm (only when no match found).
 *   Step 3 — Add First Activity (InlineSalesActivityForm, pre-anchored).
 *
 * Adaptation (RULE 0/C/D): the bible's react-query reads/writes
 * (`Attorney.list`, `Client.list`, `Attorney.update/create`, `Client.create`)
 * become reads off `useSalesActivities()` (attorneys) + `useClientsList()`
 * (clients) and writes through the sales-activity store via the hook. The
 * email-guess heuristic is the pure `guessContactEmail` rule. The bible's
 * `ResponsiveModal` (with step header + footer) becomes the port's
 * `ResponsiveModal`; the step pills + nav buttons render in the body.
 *
 * HotSeatersMVP is the bible.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, User, Building2, Search } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { ResponsiveModal } from '@/components/ui/responsive-modal';

import { useTier1 } from '@/app/tier1-provider';
import { useClientsList } from '@/features/clients/hooks/use-clients-list';
import {
  useSalesActivities,
  type AttorneyRecord,
} from '@/features/deals/hooks/use-sales-activities';
import { guessContactEmail } from '@/features/deals/business-rules/guess-contact-email';
import { InlineSalesActivityForm, type InlineFormUser } from './inline-sales-activity-form';

interface AddContactWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userInfo: (InlineFormUser & { company_id?: string | null }) | null;
  onCreated?: () => void;
}

interface NewContactState {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  title: string;
}

const EMPTY_CONTACT: NewContactState = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  title: '',
};

export function AddContactWizard({ open, onOpenChange, userInfo, onCreated }: AddContactWizardProps) {
  const { clientTypes } = useTier1();
  const { clients } = useClientsList();
  const {
    attorneys,
    setAttorneyProspectStatus,
    createAttorney,
    createClient: createClientRow,
  } = useSalesActivities();

  const [step, setStep] = useState(0);
  const [selectedAttorney, setSelectedAttorney] = useState<AttorneyRecord | null>(null);
  const [savedAttorneyId, setSavedAttorneyId] = useState<string | null>(null);
  const [savedClientId, setSavedClientId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeField, setActiveField] = useState<'contact' | 'firm' | null>(null);
  const contactSearchRef = useRef<HTMLDivElement>(null);
  const firmSearchRef = useRef<HTMLDivElement>(null);

  const [newContact, setNewContact] = useState<NewContactState>(EMPTY_CONTACT);
  const [newFirm, setNewFirm] = useState({ firm_name: '', client_type_id: '' });

  const companyId = userInfo?.company_id ?? null;

  const contactMatches = useMemo(() => {
    if (!searchQuery || searchQuery.trim().length < 2) return [];
    const term = searchQuery.toLowerCase().trim();
    const parts = term.split(' ').filter((p) => p.length > 0);
    return attorneys
      .filter((a) => {
        const fullName = `${a.first_name ?? ''} ${a.last_name ?? ''}`.toLowerCase();
        return parts.every((part) => fullName.includes(part));
      })
      .slice(0, 8)
      .map((a) => ({ attorney: a, client: clients.find((c) => c.id === a.client_id) ?? null }));
  }, [searchQuery, attorneys, clients]);

  const firmMatches = useMemo(() => {
    if (!newFirm.firm_name || newFirm.firm_name.trim().length < 2) return [];
    const term = newFirm.firm_name.toLowerCase().trim();
    return clients.filter((c) => (c.firm_name ?? '').toLowerCase().includes(term)).slice(0, 8);
  }, [newFirm.firm_name, clients]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (contactSearchRef.current && !contactSearchRef.current.contains(e.target as Node)) {
        setActiveField((prev) => (prev === 'contact' ? null : prev));
      }
      if (firmSearchRef.current && !firmSearchRef.current.contains(e.target as Node)) {
        setActiveField((prev) => (prev === 'firm' ? null : prev));
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Auto-guess email when name/firm change (pure heuristic).
  useEffect(() => {
    if (!newContact.first_name || !newContact.last_name || !newFirm.firm_name) return;
    const firm = clients.find(
      (c) => (c.firm_name ?? '').toLowerCase() === newFirm.firm_name.trim().toLowerCase(),
    );
    if (!firm) return;
    const firmContacts = attorneys.filter((a) => a.client_id === firm.id);
    const guessed = guessContactEmail(newContact.first_name, newContact.last_name, firmContacts);
    if (guessed) setNewContact((prev) => ({ ...prev, email: guessed }));
  }, [newContact.first_name, newContact.last_name, newFirm.firm_name, attorneys, clients]);

  const handleSelectContact = async (attorney: AttorneyRecord, clientId: string | null) => {
    // Path A: flip the existing contact to an active prospect.
    try {
      await setAttorneyProspectStatus(attorney.id, true);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to select contact.');
      return; // stay on the current step
    }
    setSavedAttorneyId(attorney.id);
    setSavedClientId(clientId ?? attorney.client_id ?? null);
    setSelectedAttorney(attorney);
    setActiveField(null);
    setSearchQuery('');
    setStep(2);
  };

  const handleNoMatchContinue = () => {
    const parts = searchQuery.trim().split(/\s+/);
    setNewContact((prev) => ({
      ...prev,
      first_name: parts[0] ?? '',
      last_name: parts.slice(1).join(' ') || '',
    }));
    setStep(1);
  };

  const handleSelectFirm = (firmName: string, clientTypeId: string | null) => {
    setNewFirm({ firm_name: firmName, client_type_id: clientTypeId ?? '' });
    setActiveField(null);
    setNewContact((prev) => ({ ...prev, email: '' }));
  };

  const saveContactAndFirm = async () => {
    // Path B (existing firm) or C (new firm), then create the attorney.
    try {
      const existingFirm = clients.find(
        (c) => (c.firm_name ?? '').toLowerCase() === newFirm.firm_name.trim().toLowerCase(),
      );
      let clientId: string;
      if (existingFirm) {
        clientId = existingFirm.id;
      } else {
        const created = await createClientRow({
          company_id: companyId,
          firm_name: newFirm.firm_name.trim(),
          client_type_id: newFirm.client_type_id || null,
          sales_lead: userInfo?.id ?? null,
        });
        clientId = created.id;
      }
      setSavedClientId(clientId);

      const attorney = await createAttorney({
        company_id: companyId,
        client_id: clientId,
        first_name: newContact.first_name.trim(),
        last_name: newContact.last_name.trim(),
        title: newContact.title.trim() || null,
        email: newContact.email.trim() || null,
        phone: newContact.phone.replace(/\D/g, '') || null,
        is_active_prospect: true,
      });
      setSavedAttorneyId(attorney.id);
      setStep(2);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save contact.');
      // stay on the current step
    }
  };

  const canAdvanceStep2 = (): boolean =>
    !!newContact.first_name.trim() &&
    !!newContact.last_name.trim() &&
    !!newFirm.firm_name.trim() &&
    !!newFirm.client_type_id;

  const handleNext = async () => {
    if (step === 0) {
      if (searchQuery.trim().length >= 2) {
        if (contactMatches.length > 0) return;
        handleNoMatchContinue();
      }
    } else if (step === 1 && canAdvanceStep2()) {
      await saveContactAndFirm();
    }
  };

  const resetAndClose = () => {
    setStep(0);
    setSelectedAttorney(null);
    setSavedAttorneyId(null);
    setSavedClientId(null);
    setSearchQuery('');
    setNewContact(EMPTY_CONTACT);
    setNewFirm({ firm_name: '', client_type_id: '' });
    onOpenChange(false);
  };

  const handleBack = () => {
    if (step === 2) {
      if (selectedAttorney) {
        setStep(0);
        setSearchQuery('');
      } else {
        setStep(1);
      }
    } else if (step === 1) {
      setStep(0);
      setSearchQuery('');
    } else {
      resetAndClose();
    }
  };

  const inputStyle = {
    borderRadius: 'var(--theme-input-radius)',
    borderWidth: 'var(--theme-input-border)',
    backgroundColor: 'var(--theme-input-bg)',
  };

  const contactName = selectedAttorney
    ? `${selectedAttorney.first_name} ${selectedAttorney.last_name}`
    : `${newContact.first_name} ${newContact.last_name}`;

  const stepDescription =
    step === 0 ? 'Step 1: Search for Contact' : step === 1 ? 'Step 2: Create New Contact & Firm' : 'Step 3: Add First Activity';

  return (
    <ResponsiveModal open={open} onClose={resetAndClose} title="Add Contact">
      {/* Step pills */}
      <div className="flex items-center gap-1 mb-3">
        {[Search, User, Check].map((Icon, i) => (
          <div key={i} className="flex items-center gap-1">
            <div
              className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium transition-colors ${
                step === i ? 'text-white' : 'text-stone-400 border border-stone-200'
              }`}
              style={{
                backgroundColor: step === i ? 'var(--theme-brand-primary)' : 'transparent',
                opacity: step > i ? 0.6 : 1,
              }}
            >
              <Icon className="w-3 h-3" />
            </div>
            {i < 2 && (
              <div
                className="w-4 h-0.5 rounded-full"
                style={{ backgroundColor: step >= i + 1 ? 'var(--theme-brand-primary)' : 'var(--theme-stone-200)' }}
              />
            )}
          </div>
        ))}
      </div>
      <p className="text-xs mb-3" style={{ color: 'var(--theme-stone-500)' }}>
        {stepDescription}
      </p>

      <div className="py-2 space-y-4">
        {step === 0 && (
          <>
            <div ref={contactSearchRef} className="relative">
              <Label className="text-sm font-medium" style={{ color: 'var(--theme-stone-700)' }}>
                Contact Name
              </Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--theme-stone-400)' }} />
                <Input
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setActiveField('contact');
                  }}
                  onFocus={() => setActiveField('contact')}
                  placeholder="Type first and last name..."
                  className="pl-9"
                  style={inputStyle}
                  autoFocus
                />
              </div>
              {activeField === 'contact' && contactMatches.length > 0 && (
                <div
                  className="relative left-0 right-0 mt-1 border rounded-lg shadow-lg bg-white z-50 max-h-64 overflow-y-auto"
                  style={{ borderColor: 'var(--theme-stone-200)' }}
                >
                  {contactMatches.map((m) => (
                    <button
                      key={m.attorney.id}
                      onClick={() => void handleSelectContact(m.attorney, m.client?.id ?? null)}
                      className="flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-stone-50 text-sm"
                    >
                      <User className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--theme-stone-400)' }} />
                      <span className="truncate flex-1" style={{ color: 'var(--theme-stone-900)' }}>
                        {m.attorney.first_name} {m.attorney.last_name}
                      </span>
                      {m.client?.firm_name && (
                        <span className="text-xs flex-shrink-0" style={{ color: 'var(--theme-stone-500)' }}>
                          — {m.client.firm_name}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {searchQuery.trim().length >= 2 && contactMatches.length === 0 && (
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                <p className="text-sm text-blue-900 mb-2">
                  No contact found for &quot;<strong>{searchQuery}</strong>&quot;
                </p>
                <Button
                  onClick={handleNoMatchContinue}
                  size="sm"
                  className="w-full"
                  style={{ backgroundColor: 'var(--theme-brand-primary)', color: 'white', borderRadius: 'var(--theme-button-radius)' }}
                >
                  Create New Contact <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            )}

            {searchQuery.trim().length < 2 && (
              <p className="text-xs text-stone-500 mt-1">Start typing a contact&apos;s name to search...</p>
            )}
          </>
        )}

        {step === 1 && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm font-medium" style={{ color: 'var(--theme-stone-700)' }}>
                  First Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={newContact.first_name}
                  onChange={(e) => setNewContact({ ...newContact, first_name: e.target.value })}
                  placeholder="First name"
                  className="mt-1"
                  style={inputStyle}
                />
              </div>
              <div>
                <Label className="text-sm font-medium" style={{ color: 'var(--theme-stone-700)' }}>
                  Last Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={newContact.last_name}
                  onChange={(e) => setNewContact({ ...newContact, last_name: e.target.value })}
                  placeholder="Last name"
                  className="mt-1"
                  style={inputStyle}
                />
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium" style={{ color: 'var(--theme-stone-700)' }}>
                Email
              </Label>
              <Input
                value={newContact.email}
                onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                placeholder="email@firm.com"
                type="email"
                className="mt-1"
                style={inputStyle}
              />
            </div>

            <div>
              <Label className="text-sm font-medium" style={{ color: 'var(--theme-stone-700)' }}>
                Phone
              </Label>
              <Input
                value={newContact.phone}
                onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                placeholder="(555) 555-5555"
                className="mt-1"
                style={inputStyle}
              />
            </div>

            <div>
              <Label className="text-sm font-medium" style={{ color: 'var(--theme-stone-700)' }}>
                Title
              </Label>
              <Input
                value={newContact.title}
                onChange={(e) => setNewContact({ ...newContact, title: e.target.value })}
                placeholder="e.g. Partner, Associate"
                className="mt-1"
                style={inputStyle}
              />
            </div>

            <div ref={firmSearchRef} className="relative pt-2">
              <Label className="text-sm font-medium" style={{ color: 'var(--theme-stone-700)' }}>
                Firm / Organization Name <span className="text-red-500">*</span>
              </Label>
              <div className="relative mt-1">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--theme-stone-400)' }} />
                <Input
                  value={newFirm.firm_name}
                  onChange={(e) => {
                    setNewFirm({ ...newFirm, firm_name: e.target.value });
                    setActiveField('firm');
                  }}
                  onFocus={() => setActiveField('firm')}
                  placeholder="e.g. Smith & Associates LLP"
                  className="pl-9"
                  style={inputStyle}
                />
              </div>
              {activeField === 'firm' && firmMatches.length > 0 && (
                <div
                  className="relative left-0 right-0 mt-1 border rounded-lg shadow-lg bg-white z-50 max-h-48 overflow-y-auto"
                  style={{ borderColor: 'var(--theme-stone-200)' }}
                >
                  {firmMatches.map((client) => (
                    <button
                      key={client.id}
                      onClick={() =>
                        handleSelectFirm(client.firm_name ?? '', client.client_type_id ?? null)
                      }
                      className="flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-stone-50 text-sm"
                    >
                      <Building2 className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--theme-stone-400)' }} />
                      <span className="truncate flex-1" style={{ color: 'var(--theme-stone-900)' }}>
                        {client.firm_name}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {firmMatches.length === 0 && (
              <div className="pt-2">
                <Label className="text-sm font-medium" style={{ color: 'var(--theme-stone-700)' }}>
                  Client Type <span className="text-red-500">*</span>
                </Label>
                <NativeSelect
                  value={newFirm.client_type_id || ''}
                  onChange={(e) => setNewFirm({ ...newFirm, client_type_id: e.target.value })}
                  className="mt-1"
                  style={inputStyle}
                >
                  <NativeSelectOption value="">Select type...</NativeSelectOption>
                  {clientTypes.map((ct) => (
                    <NativeSelectOption key={ct.id} value={ct.id}>
                      {ct.name}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </div>
            )}
          </>
        )}

        {step === 2 && (
          <div className="space-y-2">
            <p className="text-xs text-stone-500 mb-3">
              Add a follow-up activity for <strong>{contactName}</strong>
              {selectedAttorney ? '' : ` at ${newFirm.firm_name}`}, or skip for now.
            </p>
            <InlineSalesActivityForm
              mode="new"
              attorneyId={savedAttorneyId}
              clientId={savedClientId}
              companyId={companyId}
              userInfo={userInfo}
              contactName={contactName}
              onDone={() => {
                resetAndClose();
                onCreated?.();
              }}
              onCancel={() => {
                resetAndClose();
                onCreated?.();
              }}
              skipLabel="Skip for now"
              showActivityTypeLabels
            />
          </div>
        )}
      </div>

      {/* Footer nav (steps 0/1; step 2's form owns its own buttons) */}
      <div className="flex items-center justify-between w-full pt-2">
        <Button variant="outline" onClick={handleBack} style={{ borderRadius: 'var(--theme-button-radius)' }}>
          {step === 0 ? (
            'Cancel'
          ) : (
            <>
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </>
          )}
        </Button>
        {step < 2 && (
          <Button
            onClick={() => void handleNext()}
            disabled={(step === 0 && searchQuery.trim().length < 2) || (step === 1 && !canAdvanceStep2())}
            className="hover:opacity-90"
            style={{ backgroundColor: 'var(--theme-brand-primary)', color: 'white', borderRadius: 'var(--theme-button-radius)' }}
          >
            Next <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        )}
      </div>
    </ResponsiveModal>
  );
}
