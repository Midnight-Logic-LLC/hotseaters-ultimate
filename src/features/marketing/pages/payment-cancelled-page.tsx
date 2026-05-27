/**
 * payment-cancelled-page.tsx — shown when Stripe checkout is abandoned.
 *
 * BIBLE: HotSeatersMVP/src/pages/PaymentCancelled.jsx
 *
 * Two CTAs: "Back to Pricing" (primary) and "Go to Dashboard" (outline).
 * No charges made — reassure the user.
 */
import { useNavigate } from 'react-router-dom';
import { XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function PaymentCancelledPage() {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{
        background:
          'linear-gradient(to bottom right, color-mix(in srgb, var(--theme-stone-100) 50%, white), white, color-mix(in srgb, var(--theme-brand-primary) 8%, white))',
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
              background: `linear-gradient(to bottom right, var(--theme-warning), color-mix(in srgb, var(--theme-warning) 80%, black))`,
              borderRadius: 'var(--theme-card-radius)',
            }}
          >
            <XCircle className="w-10 h-10 text-white" />
          </div>
          <CardTitle
            style={{
              fontSize: 'var(--theme-text-section-title)',
              color: 'var(--theme-stone-900)',
            }}
          >
            Payment Cancelled
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
            Your payment was cancelled. No charges were made to your account.
          </p>
          <p
            style={{
              fontSize: 'var(--theme-text-label)',
              color: 'var(--theme-stone-500)',
            }}
          >
            You can try again anytime to activate your subscription.
          </p>
          <div
            className="flex flex-col mt-6"
            style={{ gap: 'var(--theme-element-gap)' }}
          >
            <Button
              onClick={() => navigate('/Pricing')}
              className="w-full hover:opacity-90 transition-opacity"
              style={{
                backgroundColor: 'var(--theme-brand-primary)',
                color: 'white',
                borderRadius: 'var(--theme-button-radius)',
                boxShadow: 'var(--theme-button-shadow)',
              }}
            >
              Back to Pricing
            </Button>
            <Button
              onClick={() => navigate('/Dashboard')}
              variant="outline"
              className="w-full"
              style={{
                borderRadius: 'var(--theme-button-radius)',
                boxShadow: 'var(--theme-button-shadow)',
              }}
            >
              Go to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
