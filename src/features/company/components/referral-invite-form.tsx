/**
 * referral-invite-form.tsx — HSH referral invitation form.
 *
 * BIBLE: HotSeatersMVP/src/components/consultants/ReferralInviteForm.jsx
 *
 * Renders as a Drawer on mobile, Dialog on desktop (via responsive primitives).
 * The parent passes the send mutation callback so this stays a pure UI component
 * (RULE B — no store imports).
 */
import { useState } from 'react';
import { Orbit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
import { useIsMobile } from '@/shared/hooks/use-mobile';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface ReferralFormData {
  email: string;
  first_name: string;
  last_name: string;
}

interface ReferralInviteFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSend: (data: ReferralFormData) => void;
  isSending?: boolean;
}

// ── Component ──────────────────────────────────────────────────────────────────

export function ReferralInviteForm({
  open,
  onOpenChange,
  onSend,
  isSending = false,
}: ReferralInviteFormProps) {
  const isMobile = useIsMobile();
  const [data, setData] = useState<ReferralFormData>({ email: '', first_name: '', last_name: '' });

  const handleSend = () => {
    if (!data.email || isSending) return;
    onSend(data);
    setData({ email: '', first_name: '', last_name: '' });
  };

  const title = (
    <span className="flex items-center gap-2">
      <Orbit className="w-5 h-5" style={{ color: 'var(--theme-hsh-primary)' }} />
      Send Referral Invitation
    </span>
  );

  const description =
    "Invite someone outside your company to join HotSeaters. They'll create their own company account and can connect with you through HotSeatHub.";

  const body = (
    <div className="space-y-4 pt-2">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="refFirstName">First Name</Label>
          <Input
            id="refFirstName"
            value={data.first_name}
            onChange={(e) => setData({ ...data, first_name: e.target.value })}
            placeholder="Jane"
          />
        </div>
        <div>
          <Label htmlFor="refLastName">Last Name</Label>
          <Input
            id="refLastName"
            value={data.last_name}
            onChange={(e) => setData({ ...data, last_name: e.target.value })}
            placeholder="Smith"
          />
        </div>
      </div>
      <div>
        <Label htmlFor="refEmail">Email Address *</Label>
        <Input
          id="refEmail"
          type="email"
          value={data.email}
          onChange={(e) => setData({ ...data, email: e.target.value })}
          placeholder="jane.smith@example.com"
          required
        />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button
          onClick={handleSend}
          disabled={!data.email || isSending}
          className="hover:opacity-90 transition-opacity"
          style={{ backgroundColor: 'var(--theme-hsh-primary)', color: 'white' }}
        >
          {isSending ? 'Sending...' : 'Send Referral'}
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="text-left">
            <DrawerTitle>{title}</DrawerTitle>
            <DrawerDescription>{description}</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-6 overflow-y-auto">{body}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {body}
      </DialogContent>
    </Dialog>
  );
}
