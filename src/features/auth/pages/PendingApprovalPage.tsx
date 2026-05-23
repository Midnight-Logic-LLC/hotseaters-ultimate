/**
 * PendingApprovalPage — shown when `user_info.account_status === 'pending'`.
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */

import { AuthCard } from '@/features/auth/components/AuthCard';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/hooks/use-auth';

export function PendingApprovalPage() {
  const { signOut } = useAuth();
  return (
    <AuthCard
      title="Awaiting approval"
      subtitle="Your account is pending approval by your firm&rsquo;s owner."
    >
      <div className="flex flex-col gap-3" style={{ textAlign: 'center' }}>
        <p style={{ color: 'var(--theme-stone-600)' }}>
          You&apos;ll receive an email once you&apos;ve been approved. In the meantime, you can
          sign out and come back later.
        </p>
        <Button onClick={() => void signOut()} variant="outline" className="w-full">
          Sign out
        </Button>
      </div>
    </AuthCard>
  );
}
