/**
 * payment-success-page.tsx — shown after Stripe checkout succeeds.
 *
 * BIBLE: HotSeatersMVP/src/pages/PaymentSuccess.jsx
 *
 * Auto-redirects to /Dashboard after 3 seconds; manual "Go to Dashboard Now"
 * button for impatient users.
 */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function PaymentSuccessPage() {
  const navigate = useNavigate();
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/Dashboard');
    }, 3000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{
        background:
          'linear-gradient(to bottom right, color-mix(in srgb, var(--theme-success) 8%, white), white, color-mix(in srgb, var(--theme-brand-primary) 8%, white))',
        fontFamily: 'var(--theme-font-body)',
      }}
    >
      <Card
        className="w-full max-w-md"
        style={{
          borderRadius: 'var(--theme-card-radius)',
          boxShadow: 'var(--theme-card-shadow)',
          borderWidth: 'var(--theme-card-border)',
          borderColor: 'var(--theme-stone-200)',
          backgroundColor: 'var(--theme-card-bg)',
        }}
      >
        <CardHeader
          className="text-center pb-6"
          style={{ padding: 'var(--theme-card-header-padding)' }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{
              background: `linear-gradient(to bottom right, var(--theme-success), color-mix(in srgb, var(--theme-success) 80%, black))`,
              borderRadius: 'var(--theme-card-radius)',
            }}
          >
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <CardTitle
            style={{
              fontSize: 'var(--theme-text-section-title)',
              color: 'var(--theme-stone-900)',
            }}
          >
            Payment Successful!
          </CardTitle>
        </CardHeader>
        <CardContent
          className="text-center"
          style={{
            padding: 'var(--theme-card-padding)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--theme-card-gap)',
          }}
        >
          <p
            style={{
              color: 'var(--theme-stone-600)',
              fontSize: 'var(--theme-text-body)',
            }}
          >
            Your subscription has been activated successfully.
          </p>
          <p
            style={{
              fontSize: 'var(--theme-text-label)',
              color: 'var(--theme-stone-500)',
            }}
          >
            Redirecting you to your dashboard...
          </p>
          <Loader2
            className="w-6 h-6 animate-spin mx-auto"
            style={{ color: 'var(--theme-brand-primary)' }}
          />
          <Button
            onClick={() => navigate('/Dashboard')}
            className="w-full mt-4 hover:opacity-90 transition-opacity"
            style={{
              backgroundColor: 'var(--theme-brand-primary)',
              color: 'white',
              borderRadius: 'var(--theme-button-radius)',
              boxShadow: 'var(--theme-button-shadow)',
            }}
          >
            Go to Dashboard Now
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
