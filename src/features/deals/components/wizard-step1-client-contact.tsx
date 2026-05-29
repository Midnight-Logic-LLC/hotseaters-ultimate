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
 *   • Inline "New Contact" / "New Secondary Contact" / "New FRP Contact" forms
 *     are STUBBED: the port has no attorney(contact)-create write path yet
 *     (attorneys are read-only via REST). The "New Contact" affordance is
 *     hidden with a `// TODO(D04 contact-create)` note rather than shown as a
 *     dead button — selecting existing contacts is fully functional. See the
 *     change report; this is an auditable parity gap owned by D04.
 *
 * Components consume hook-supplied props only (RULE B). HotSeatersMVP is the bible.
 */

import { useState } from 'react';
import { Plus } from 'lucide-react';
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
  onSubmit: (draft: NewClientDraft) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<NewClientDraft>({ firm_name: '', client_type_id: '' });
  const [saving, setSaving] = useState(false);
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
            void Promise.resolve(onSubmit(draft)).finally(() => setSaving(false));
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
}: WizardStep1Props) {
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [showNewFRPClientForm, setShowNewFRPClientForm] = useState(false);

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
            {/* TODO(D04 contact-create): the bible shows a "+ New Contact" button
                here that creates an Attorney row. The port has no attorney-create
                write path yet (attorneys are read-only via REST), so the button is
                hidden until D04 lands the contact-create surface. Selecting an
                existing contact is fully functional. */}
          </div>
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
