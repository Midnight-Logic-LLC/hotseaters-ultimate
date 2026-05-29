/**
 * wizard-step1-client-contact.tsx — port of
 * HotSeatersMVP/src/components/deals/WizardStep1ClientContact.jsx.
 *
 * Step 1 of the deal wizard: Sales Lead · Client & Contacts · Financially
 * Responsible Party (FRP). Three-column layout (stacks on mobile).
 *
 * Port adaptations (RULE 0 / RULE J — preserve behaviour, adapt primitives):
 *   • Inline "New Client" / "New FRP Client" forms are BUILT — the port's
 *     client store exposes a cheap `createClient` path (wired through the
 *     deal-wizard data layer). The bible's `NewClientInlineForm` is reproduced
 *     inline (firm_name + client_type_id, the bible's `newClientData` shape).
 *   • Inline "New Contact" (PRIMARY contact) is BUILT (D04): the sales-activity
 *     store exposes `createAttorney`, wired through the wizard via
 *     `onCreateContact`. The bible's `NewContactInlineForm` is reproduced inline
 *     (first/last/email/phone/title — the bible's contact shape).
 *   • "New Secondary Contact" / "New FRP Contact" inline-create remain DEFERRED
 *     (the primary-contact path covers the common case; the secondary/FRP
 *     create forms are a follow-up). Selecting existing contacts is fully
 *     functional for all three. See the change report.
 *
 * Components consume hook-supplied props only (RULE B). HotSeatersMVP is the bible.
 */

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ClientRow } from '@/features/clients/stores/clients-store';
import type { AttorneyRow } from '@/features/lead-radar/stores/lead-radar-store';
import type { LookupRow } from '@/shared/db/lookups-selectors';
import type { DealWizardConsultant } from '@/features/deals/hooks/use-deal-wizard-data';
import type { DealFormData } from './deal-wizard-types';

export interface NewClientDraft {
  firm_name: string;
  client_type_id: string;
}

export interface NewContactDraft {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  title: string;
}

interface WizardStep1Props {
  dealData: DealFormData;
  setDealData: (next: DealFormData) => void;
  salesConsultants: DealWizardConsultant[];
  filteredClients: ClientRow[];
  clientContacts: AttorneyRow[];
  clientTypes: LookupRow[];
  hasFRP: boolean;
  setHasFRP: (next: boolean) => void;
  frpClients: ClientRow[];
  frpContacts: AttorneyRow[];
  toggleSecondaryContact: (contactId: string) => void;
  /** Create a client; resolves to the new client id (wired through the data hook). */
  onCreateClient: (draft: NewClientDraft) => Promise<string>;
  onCreateFRPClient: (draft: NewClientDraft) => Promise<string>;
  /**
   * Create a primary contact (attorney) for the selected client (D04).
   * Resolves to the new attorney id. Requires a client to be selected first.
   */
  onCreateContact: (clientId: string, draft: NewContactDraft) => Promise<string>;
}

const SELECT_CONTENT_STYLE: React.CSSProperties = {
  fontFamily: 'var(--theme-font-body)',
  fontSize: 'var(--theme-text-body)',
};

function byLastThenFirst(
  a: { last_name: string | null; first_name: string | null },
  b: { last_name: string | null; first_name: string | null },
): number {
  const lc = (a.last_name || '').localeCompare(b.last_name || '');
  return lc !== 0 ? lc : (a.first_name || '').localeCompare(b.first_name || '');
}

/** Inline new-client form (bible NewClientInlineForm — firm_name + type). */
function NewClientInlineForm({
  clientTypes,
  onSubmit,
  onCancel,
}: {
  clientTypes: LookupRow[];
  onSubmit: (draft: NewClientDraft) => Promise<void>;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<NewClientDraft>({ firm_name: '', client_type_id: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="p-4 border border-stone-200 rounded-lg space-y-3 bg-stone-50">
      <Input
        placeholder="Firm Name"
        value={draft.firm_name}
        onChange={(e) => setDraft({ ...draft, firm_name: e.target.value })}
      />
      <Select
        value={draft.client_type_id || undefined}
        onValueChange={(value) => setDraft({ ...draft, client_type_id: value ?? '' })}
      >
        <SelectTrigger>
          <SelectValue placeholder="Client Type" />
        </SelectTrigger>
        <SelectContent style={SELECT_CONTENT_STYLE}>
          {[...clientTypes]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((ct) => (
              <SelectItem key={ct.id} value={ct.id}>
                {ct.name}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          disabled={!draft.firm_name || saving}
          onClick={() => {
            setSaving(true);
            setError(null);
            // The caller's onCreateClient can reject (store write fails); surface
            // it instead of swallowing, and keep the form open so the user can retry.
            void Promise.resolve(onSubmit(draft))
              .catch((err: unknown) => {
                const message = err instanceof Error ? err.message : 'Failed to create client';
                setError(message);
                toast.error(message);
              })
              .finally(() => setSaving(false));
          }}
          style={{ backgroundColor: 'var(--theme-brand-primary)', color: 'white' }}
          className="hover:opacity-90 transition-opacity"
        >
          {saving ? 'Creating...' : 'Create Client'}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

/** Inline new-contact form for the PRIMARY contact (D04). */
function NewContactInlineForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (draft: NewContactDraft) => Promise<void>;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<NewContactDraft>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    title: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="p-4 border border-stone-200 rounded-lg space-y-3 bg-stone-50">
      <div className="grid grid-cols-2 gap-2">
        <Input
          placeholder="First Name"
          value={draft.first_name}
          onChange={(e) => setDraft({ ...draft, first_name: e.target.value })}
        />
        <Input
          placeholder="Last Name"
          value={draft.last_name}
          onChange={(e) => setDraft({ ...draft, last_name: e.target.value })}
        />
      </div>
      <Input
        placeholder="Email"
        type="email"
        value={draft.email}
        onChange={(e) => setDraft({ ...draft, email: e.target.value })}
      />
      <Input
        placeholder="Phone"
        value={draft.phone}
        onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
      />
      <Input
        placeholder="Title (e.g. Partner)"
        value={draft.title}
        onChange={(e) => setDraft({ ...draft, title: e.target.value })}
      />
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          disabled={!draft.first_name || !draft.last_name || saving}
          onClick={() => {
            setSaving(true);
            setError(null);
            void Promise.resolve(onSubmit(draft))
              .catch((err: unknown) => {
                const message = err instanceof Error ? err.message : 'Failed to create contact';
                setError(message);
                toast.error(message);
              })
              .finally(() => setSaving(false));
          }}
          style={{ backgroundColor: 'var(--theme-brand-primary)', color: 'white' }}
          className="hover:opacity-90 transition-opacity"
        >
          {saving ? 'Creating...' : 'Create Contact'}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

export function WizardStep1ClientContact({
  dealData,
  setDealData,
  salesConsultants,
  filteredClients,
  clientContacts,
  clientTypes,
  hasFRP,
  setHasFRP,
  frpClients,
  frpContacts,
  toggleSecondaryContact,
  onCreateClient,
  onCreateFRPClient,
  onCreateContact,
}: WizardStep1Props) {
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [showNewFRPClientForm, setShowNewFRPClientForm] = useState(false);
  const [showNewContactForm, setShowNewContactForm] = useState(false);

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Column 1: Sales Lead */}
      <div className="space-y-4">
        <div className="pb-3 border-b border-stone-200 mb-4">
          <h3 className="font-semibold text-stone-900">Sales Lead</h3>
        </div>
        <div>
          <div className="mb-2 h-8 flex items-center">
            <Label htmlFor="consultant_id">Sales Lead *</Label>
          </div>
          <Select
            value={dealData.consultant_id || undefined}
            onValueChange={(value) =>
              setDealData({
                ...dealData,
                consultant_id: value ?? '',
                client_id: '',
                primary_contact_id: '',
                secondary_contact_ids: [],
              })
            }
          >
            <SelectTrigger className="bg-purple-50">
              <SelectValue placeholder="Select sales lead" />
            </SelectTrigger>
            <SelectContent style={SELECT_CONTENT_STYLE}>
              {[...salesConsultants].sort(byLastThenFirst).map((consultant) => (
                <SelectItem key={consultant.id} value={consultant.id}>
                  {consultant.first_name} {consultant.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Column 2: Client & Contacts */}
      <div className="space-y-4">
        <div className="pb-3 border-b border-stone-200 mb-4">
          <h3 className="font-semibold text-stone-900">Client &amp; Contacts</h3>
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label htmlFor="client">Client *</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowNewClientForm(!showNewClientForm)}
              className="text-indigo-600"
              disabled={!dealData.consultant_id}
            >
              <Plus className="w-4 h-4 mr-1" /> New Client
            </Button>
          </div>
          {showNewClientForm ? (
            <NewClientInlineForm
              clientTypes={clientTypes}
              onSubmit={async (draft) => {
                const newId = await onCreateClient(draft);
                setDealData({
                  ...dealData,
                  client_id: newId,
                  primary_contact_id: '',
                  secondary_contact_ids: [],
                });
                setShowNewClientForm(false);
              }}
              onCancel={() => setShowNewClientForm(false)}
            />
          ) : (
            <Select
              value={dealData.client_id || undefined}
              onValueChange={(value) =>
                setDealData({
                  ...dealData,
                  client_id: value ?? '',
                  primary_contact_id: '',
                  secondary_contact_ids: [],
                })
              }
              disabled={!dealData.consultant_id}
            >
              <SelectTrigger className="bg-purple-50">
                <SelectValue
                  placeholder={
                    !dealData.consultant_id ? 'Select sales lead first' : 'Select client'
                  }
                />
              </SelectTrigger>
              <SelectContent style={SELECT_CONTENT_STYLE}>
                {[...filteredClients]
                  .sort((a, b) => (a.firm_name ?? '').localeCompare(b.firm_name ?? ''))
                  .map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.firm_name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <Label htmlFor="contact">Primary Contact *</Label>
            {/* D04: "+ New Contact" creates an Attorney for the selected client. */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowNewContactForm(!showNewContactForm)}
              className="text-indigo-600"
              disabled={!dealData.client_id}
            >
              <Plus className="w-4 h-4 mr-1" /> New Contact
            </Button>
          </div>
          {showNewContactForm ? (
            <NewContactInlineForm
              onSubmit={async (draft) => {
                const newId = await onCreateContact(dealData.client_id, draft);
                setDealData({ ...dealData, primary_contact_id: newId });
                setShowNewContactForm(false);
              }}
              onCancel={() => setShowNewContactForm(false)}
            />
          ) : (
            <Select
              value={dealData.primary_contact_id || undefined}
              onValueChange={(value) =>
                setDealData({ ...dealData, primary_contact_id: value ?? '' })
              }
              disabled={!dealData.client_id}
            >
              <SelectTrigger className="bg-purple-50">
                <SelectValue placeholder="Select contact" />
              </SelectTrigger>
              <SelectContent style={SELECT_CONTENT_STYLE}>
                {[...clientContacts].sort(byLastThenFirst).map((contact) => (
                  <SelectItem key={contact.id} value={contact.id}>
                    {contact.first_name} {contact.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {dealData.client_id && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Secondary Contacts (Optional)</Label>
              {/* TODO(D04 contact-create): "+ New Contact" for secondary contacts
                  is owned by D04 (no attorney-create path yet). */}
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto border border-stone-200 rounded-lg p-3">
              {clientContacts
                .filter((c) => c.id !== dealData.primary_contact_id)
                .sort(byLastThenFirst)
                .map((contact) => (
                  <div key={contact.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`secondary-${contact.id}`}
                      checked={dealData.secondary_contact_ids.includes(contact.id)}
                      onChange={() => toggleSecondaryContact(contact.id)}
                      className="w-4 h-4 text-indigo-600 rounded"
                    />
                    <Label htmlFor={`secondary-${contact.id}`} className="cursor-pointer text-sm">
                      {contact.first_name} {contact.last_name} ({contact.email})
                    </Label>
                  </div>
                ))}
              {clientContacts.filter((c) => c.id !== dealData.primary_contact_id).length ===
                0 && (
                <p className="text-sm text-stone-500 text-center py-2">
                  No additional contacts available
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Column 3: FRP */}
      <div className="space-y-4">
        <div className="pb-3 border-b border-stone-200 mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-stone-900">Financially Responsible Party</h3>
          <input
            type="checkbox"
            id="hasFRP"
            checked={hasFRP}
            onChange={(e) => {
              setHasFRP(e.target.checked);
              if (!e.target.checked) {
                setDealData({ ...dealData, frp_client_id: '', frp_contact_id: '' });
              }
            }}
            className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
          />
        </div>
        {hasFRP && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="frp_client">FRP Client *</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNewFRPClientForm(!showNewFRPClientForm)}
                  className="text-indigo-600"
                >
                  <Plus className="w-4 h-4 mr-1" /> New FRP Client
                </Button>
              </div>
              {showNewFRPClientForm ? (
                <NewClientInlineForm
                  clientTypes={clientTypes}
                  onSubmit={async (draft) => {
                    const newId = await onCreateFRPClient(draft);
                    setDealData({ ...dealData, frp_client_id: newId, frp_contact_id: '' });
                    setShowNewFRPClientForm(false);
                  }}
                  onCancel={() => setShowNewFRPClientForm(false)}
                />
              ) : (
                <Select
                  value={dealData.frp_client_id || undefined}
                  onValueChange={(value) =>
                    setDealData({ ...dealData, frp_client_id: value ?? '', frp_contact_id: '' })
                  }
                >
                  <SelectTrigger className="bg-purple-50">
                    <SelectValue placeholder="Select FRP client" />
                  </SelectTrigger>
                  <SelectContent style={SELECT_CONTENT_STYLE}>
                    {[...frpClients]
                      .sort((a, b) => (a.firm_name ?? '').localeCompare(b.firm_name ?? ''))
                      .map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.firm_name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            {dealData.frp_client_id && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="frp_contact">FRP Contact *</Label>
                  {/* TODO(D04 contact-create): "+ New FRP Contact" owned by D04. */}
                </div>
                <Select
                  value={dealData.frp_contact_id || undefined}
                  onValueChange={(value) =>
                    setDealData({ ...dealData, frp_contact_id: value ?? '' })
                  }
                >
                  <SelectTrigger className="bg-purple-50">
                    <SelectValue placeholder="Select FRP contact" />
                  </SelectTrigger>
                  <SelectContent style={SELECT_CONTENT_STYLE}>
                    {[...frpContacts].sort(byLastThenFirst).map((contact) => (
                      <SelectItem key={contact.id} value={contact.id}>
                        {contact.first_name} {contact.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
