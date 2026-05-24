/**
 * AccountRejectedPage — shown when `account_status === 'rejected'`.
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */

import { AuthCard } from '@/features/auth/components/auth-card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/hooks/use-auth';

export function AccountRejectedPage() {
  const { signOut } = useAuth();
  return (
    <AuthCard title="Access denied" subtitle="Your account request was declined.">
      <div className="flex flex-col gap-3" style={{ textAlign: 'center' }}>
        <p style={{ color: 'var(--theme-stone-600)' }}>
          If you believe this is an error, please contact your firm&rsquo;s owner.
        </p>
        <Button onClick={() => void signOut()} variant="outline" className="w-full">
          Sign out
        </Button>
      </div>
    </AuthCard>
  );
}
