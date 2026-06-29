/**
 * PricingPage — port of HotSeatersMVP/src/pages/Pricing.jsx.
 *
 * Bible facts:
 *   - Public pricing page: anonymous/unauthenticated visitors SEE the
 *     pricing card (they are NOT redirected). This route is registered as
 *     a public marketing route (outside <AuthGate>), so the bible's
 *     in-app auth bounce is intentionally relaxed here.
 *   - Spinner only while auth state is genuinely loading.
 *   - Onboarding redirect applies ONLY to an AUTHENTICATED user with no
 *     company_id (the "finish onboarding before you can subscribe" case).
 *   - Monthly/Yearly billing toggle with "Save 20%" badge.
 *   - Prices: MONTHLY=$45/user/month, YEARLY=$36/user/month.
 *   - Single "HotSeaters" plan card with 9 features.
 *   - Get Started → stub toast (Stripe checkout not wired yet).
 *   - Trust line + Privacy Policy / Terms of Service modal triggers.
 *
 * RULE 0: pixel parity with the bible.
 * RULE A: kebab-case filename.
 * RULE B: no direct store imports — uses useTier1() hook.
 * HotSeatersMVP is the bible. Self-hosted Supabase only.
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Loader2, Users, Orbit } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTier1 } from '@/app/tier1-provider';
import { PolicyViewerModal } from '@/features/marketing/components/policy-viewer-modal';
import { applyThemeVars, DEFAULT_THEME, MARKETING_THEME } from '@/shared/lib/theme';

const MONTHLY_PRICE = 45;
const YEARLY_DISCOUNT = 0.2;
const yearlyMonthlyPrice = Math.round(MONTHLY_PRICE * (1 - YEARLY_DISCOUNT)); // 36
const yearlyAnnualPrice = yearlyMonthlyPrice * 12; // 432
const yearlySavingsPerUser = MONTHLY_PRICE * 12 - yearlyAnnualPrice; // 108

const FEATURES: string[] = [
  'Complete deal & trial management',
  'Engagement letters with e-signatures',
  'Time tracking & invoicing',
  'Schedule & expense management',
  'Team collaboration & assignments',
  'Role-based permissions',
  'Consolidated reporting',
  'Unlimited clients & trials',
  'HotSeatHub marketplace included',
];

type BillingPeriod = 'monthly' | 'yearly';

interface PolicyModalState {
  type: 'privacy' | 'terms';
  title: string;
}

export function PricingPage() {
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly');
  useEffect(() => {
    applyThemeVars(MARKETING_THEME);
    return () => applyThemeVars(DEFAULT_THEME);
  }, []);

  const [policyModalOpen, setPolicyModalOpen] = useState(false);
  const [policyModalData, setPolicyModalData] = useState<PolicyModalState>({
    type: 'privacy',
    title: 'Privacy Policy',
  });

  const navigate = useNavigate();
  const t1 = useTier1();

  // Public pricing page. Anonymous/unauthenticated visitors fall through
  // and see the pricing card — they are NOT redirected (this route lives
  // outside <AuthGate>). Only an AUTHENTICATED user (t1.userInfo present)
  // who hasn't completed onboarding (no company_id) is sent to /Onboarding,
  // matching the in-app "finish onboarding before you can subscribe" rule.
  useEffect(() => {
    if (t1.isLoading) return;
    if (t1.userInfo && !t1.userInfo.company_id) {
      navigate('/Onboarding');
    }
  }, [t1.isLoading, t1.userInfo, navigate]);

  const handleGetStarted = async () => {
    setIsCheckingOut(true);
    try {
      // Stripe checkout is not yet wired. Show a stub toast matching
      // the task spec rather than attempting a real API call.
      toast.info(
        'Stripe checkout will be available soon. Contact support@hotseaters.com to subscribe.',
      );
    } finally {
      setIsCheckingOut(false);
    }
  };

  const openPolicy = (type: 'privacy' | 'terms', title: string) => {
    setPolicyModalData({ type, title });
    setPolicyModalOpen(true);
  };

  // Show spinner while boot data resolves (bible line 83-89).
  if (t1.isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          background:
            'linear-gradient(to bottom right, color-mix(in srgb, var(--theme-brand-primary) 8%, white), white, color-mix(in srgb, var(--theme-stone-200) 50%, white))',
        }}
      >
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--theme-brand-primary)' }} />
      </div>
    );
  }

  const displayPrice = billingPeriod === 'yearly' ? yearlyMonthlyPrice : MONTHLY_PRICE;

  return (
    <div
      className="min-h-screen p-6"
      style={{
        background:
          'linear-gradient(to bottom right, color-mix(in srgb, var(--theme-brand-primary) 8%, white), white, color-mix(in srgb, var(--theme-stone-200) 50%, white))',
        fontFamily: 'var(--theme-font-body)',
      }}
    >
      <div className="mx-auto" style={{ maxWidth: 'var(--theme-max-content-width)' }}>
        {/* Header */}
        <div className="text-center mb-12">
          <h1
            className="font-bold mb-4"
            style={{
              fontSize: 'clamp(2rem, 5vw, 2.5rem)',
              color: 'var(--theme-stone-900)',
            }}
          >
            Choose Your Plan
          </h1>
          <p
            className="mb-8"
            style={{
              fontSize: 'var(--theme-text-section-title)',
              color: 'var(--theme-stone-600)',
            }}
          >
            Start managing your trial consulting business today
          </p>

          {/* Billing toggle */}
          <div
            className="inline-flex items-center gap-3 p-1.5"
            style={{
              backgroundColor: 'var(--theme-card-bg)',
              borderRadius: 'var(--theme-button-radius)',
              boxShadow: 'var(--theme-card-shadow)',
              border: '1px solid var(--theme-stone-200)',
              fontFamily: 'var(--theme-font-body)',
            }}
          >
            <button
              onClick={() => setBillingPeriod('monthly')}
              className="px-6 py-2.5 font-medium transition-all"
              style={{
                borderRadius: 'var(--theme-button-radius)',
                ...(billingPeriod === 'monthly'
                  ? {
                      backgroundColor: 'var(--theme-brand-primary)',
                      color: 'white',
                      boxShadow: 'var(--theme-button-shadow)',
                    }
                  : { color: 'var(--theme-stone-600)' }),
              }}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className="px-6 py-2.5 font-medium transition-all flex items-center"
              style={{
                borderRadius: 'var(--theme-button-radius)',
                ...(billingPeriod === 'yearly'
                  ? {
                      backgroundColor: 'var(--theme-brand-primary)',
                      color: 'white',
                      boxShadow: 'var(--theme-button-shadow)',
                    }
                  : { color: 'var(--theme-stone-600)' }),
              }}
            >
              Yearly
              <Badge className="ml-2 bg-green-100 text-green-700 hover:bg-green-100">
                Save 20%
              </Badge>
            </button>
          </div>
        </div>

        {/* Single plan card */}
        <div className="max-w-xl mx-auto mb-8">
          <Card
            className="relative transition-all hover:shadow-xl"
            style={{
              borderRadius: 'var(--theme-card-radius)',
              boxShadow: 'var(--theme-card-shadow)',
              borderWidth: '2px',
              borderColor: 'var(--theme-brand-primary)',
              backgroundColor: 'var(--theme-card-bg)',
            }}
          >
            <CardHeader
              className="text-center pb-4"
              style={{
                borderBottom: '1px solid var(--theme-stone-200)',
                backgroundColor: 'var(--theme-card-header-bg)',
                padding: 'var(--theme-card-header-padding)',
                borderTopLeftRadius: 'var(--theme-card-radius)',
                borderTopRightRadius: 'var(--theme-card-radius)',
              }}
            >
              {/* Plan icon */}
              <div
                className="w-16 h-16 flex items-center justify-center mx-auto mb-4"
                style={{
                  background: `linear-gradient(to bottom right, color-mix(in srgb, var(--theme-brand-primary) 20%, white), color-mix(in srgb, var(--theme-brand-primary) 30%, white))`,
                  borderRadius: 'calc(var(--theme-card-radius) * 1.5)',
                }}
              >
                <Users className="w-8 h-8" style={{ color: 'var(--theme-brand-primary)' }} />
              </div>

              <CardTitle
                className="mb-2"
                style={{
                  fontSize: 'var(--theme-text-section-title)',
                  color: 'var(--theme-stone-900)',
                }}
              >
                HotSeaters
              </CardTitle>
              <p
                style={{
                  fontSize: 'var(--theme-text-body)',
                  color: 'var(--theme-stone-600)',
                }}
              >
                Everything you need to run your trial tech business — HotSeatHub marketplace
                included.
              </p>

              {/* Price display */}
              <div className="mt-6">
                <div
                  className="flex items-baseline justify-center"
                  style={{ gap: 'var(--theme-element-gap)' }}
                >
                  <span
                    className="font-bold"
                    style={{
                      fontSize: 'clamp(2.5rem, 5vw, 3rem)',
                      color: 'var(--theme-stone-900)',
                    }}
                  >
                    ${displayPrice}
                  </span>
                  <span
                    style={{
                      fontSize: 'var(--theme-text-body)',
                      color: 'var(--theme-stone-600)',
                    }}
                  >
                    /month/user
                  </span>
                </div>
                {billingPeriod === 'yearly' && (
                  <p
                    className="mt-2 font-medium"
                    style={{
                      fontSize: 'var(--theme-text-body)',
                      color: 'var(--theme-success)',
                    }}
                  >
                    Billed ${yearlyAnnualPrice}/user/year — save ${yearlySavingsPerUser}/user
                  </p>
                )}
              </div>
            </CardHeader>

            <CardContent style={{ padding: 'var(--theme-card-padding)' }}>
              {/* Features list */}
              <ul
                className="mb-6"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--theme-element-gap)',
                }}
              >
                {FEATURES.map((feature) => {
                  const isHsh = feature.toLowerCase().includes('hotseathub');
                  return (
                    <li
                      key={feature}
                      className="flex items-start"
                      style={{ gap: 'var(--theme-element-gap)' }}
                    >
                      {isHsh ? (
                        <Orbit
                          className="w-5 h-5 flex-shrink-0 mt-0.5"
                          style={{ color: 'var(--theme-hsh-primary)' }}
                        />
                      ) : (
                        <Check
                          className="w-5 h-5 flex-shrink-0 mt-0.5"
                          style={{ color: 'var(--theme-success)' }}
                        />
                      )}
                      <span
                        style={{
                          fontFamily: 'var(--theme-font-body)',
                          fontSize: 'var(--theme-text-body)',
                          color: 'var(--theme-stone-700)',
                        }}
                      >
                        {feature}
                      </span>
                    </li>
                  );
                })}
              </ul>

              <Button
                onClick={() => void handleGetStarted()}
                disabled={isCheckingOut}
                className="w-full hover:opacity-90 transition-opacity"
                style={{
                  backgroundColor: 'var(--theme-brand-primary)',
                  color: 'white',
                  borderRadius: 'var(--theme-button-radius)',
                  boxShadow: 'var(--theme-button-shadow)',
                }}
              >
                {isCheckingOut ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Get Started'
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Trust & security section */}
        <div className="mt-12 text-center space-y-4">
          <p
            style={{
              fontSize: 'var(--theme-text-body)',
              color: 'var(--theme-stone-600)',
            }}
          >
            🔒 Secure payment powered by Stripe • Cancel anytime • No hidden fees
          </p>

          <div>
            <p
              style={{
                fontSize: 'var(--theme-text-body)',
                color: 'var(--theme-stone-600)',
                marginBottom: 'var(--theme-element-gap)',
              }}
            >
              By using HotSeaters, you agree to our terms and policies:
            </p>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => openPolicy('privacy', 'Privacy Policy')}
                className="text-sm cursor-pointer bg-transparent border-none p-0 hover:underline"
                style={{ color: 'var(--theme-brand-primary)' }}
              >
                Privacy Policy
              </button>
              <button
                onClick={() => openPolicy('terms', 'Terms of Service')}
                className="text-sm cursor-pointer bg-transparent border-none p-0 hover:underline"
                style={{ color: 'var(--theme-brand-primary)' }}
              >
                Terms of Service
              </button>
            </div>
          </div>
        </div>
      </div>

      <PolicyViewerModal
        open={policyModalOpen}
        onClose={() => setPolicyModalOpen(false)}
        policyType={policyModalData.type}
        title={policyModalData.title}
      />
    </div>
  );
}
