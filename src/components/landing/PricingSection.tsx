import { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Link, useNavigate } from 'react-router-dom';
import { useSubscription, PRICE_IDS } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const plans = [
  {
    name: 'Starter',
    tier: 'starter' as const,
    monthlyPrice: 0,
    yearlyPrice: 0,
    description: 'Perfect for agents just getting started',
    features: [
      'Up to 1 active client',
      '5 properties per client',
      'Basic property details',
      'Shareable client links',
      'Email support',
    ],
    cta: 'Get Started',
    popular: false,
  },
  {
    name: 'Pro',
    tier: 'pro' as const,
    monthlyPrice: 9.99,
    yearlyPrice: 96,
    description: 'For busy agents who want to impress clients',
    features: [
      'Unlimited clients',
      'Unlimited properties',
      'Document attachments',
      'Route optimization',
      'Client feedback collection',
      'Property comparisons',
      'Priority support',
    ],
    cta: 'Upgrade to Pro',
    popular: true,
  },
  {
    name: 'Small Team',
    tier: 'team5' as const,
    monthlyPrice: 45,
    yearlyPrice: 432,
    description: 'For small real estate teams',
    features: [
      'Everything in Pro',
      'Up to 5 agents',
      'Team management',
      'Shared document library',
      'Custom branding',
      'Priority support',
    ],
    cta: 'Upgrade to Small Team',
    popular: false,
  },
  {
    name: 'Team',
    tier: 'team' as const,
    monthlyPrice: 75,
    yearlyPrice: 720,
    description: 'For brokerages & larger teams',
    features: [
      'Everything in Pro',
      'Up to 10 agents',
      'Team analytics dashboard',
      'Custom branding',
      'API access',
      'Dedicated account manager',
    ],
    cta: 'Upgrade to Team',
    popular: false,
  },
];

const PricingSection = () => {
  const [isYearly, setIsYearly] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const { tier: currentTier, subscribed, createCheckout, openCustomerPortal, loading } = useSubscription();
  const navigate = useNavigate();

  const formatPrice = (plan: typeof plans[0]) => {
    if (plan.monthlyPrice === 0) return 'Free';
    const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
    return `$${price}`;
  };

  const getPeriod = (plan: typeof plans[0]) => {
    if (plan.monthlyPrice === 0) return '';
    return isYearly ? '/year' : '/month';
  };

  const getSavingsPercent = (plan: typeof plans[0]) => {
    if (plan.monthlyPrice === 0) return null;
    const yearlyIfMonthly = plan.monthlyPrice * 12;
    const savings = ((yearlyIfMonthly - plan.yearlyPrice) / yearlyIfMonthly) * 100;
    return Math.round(savings);
  };

  const handlePlanAction = async (plan: typeof plans[0]) => {
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      // Redirect to auth page
      navigate('/auth?mode=signup');
      return;
    }

    // If clicking on current plan, open customer portal
    if (plan.tier === currentTier && subscribed) {
      try {
        setLoadingPlan(plan.name);
        await openCustomerPortal();
      } catch (error) {
        toast.error('Failed to open billing portal');
      } finally {
        setLoadingPlan(null);
      }
      return;
    }

    // For starter plan, just go to dashboard
    if (plan.tier === 'starter') {
      navigate('/dashboard');
      return;
    }

    // For paid plans, initiate checkout
    try {
      setLoadingPlan(plan.name);
      const priceId = isYearly 
        ? PRICE_IDS[plan.tier].yearly 
        : PRICE_IDS[plan.tier].monthly;
      await createCheckout(priceId);
    } catch (error) {
      toast.error('Failed to start checkout');
    } finally {
      setLoadingPlan(null);
    }
  };

  const getButtonText = (plan: typeof plans[0]) => {
    if (loadingPlan === plan.name) {
      return <Loader2 className="w-4 h-4 animate-spin" />;
    }
    
    if (plan.tier === currentTier) {
      if (subscribed) {
        return 'Manage Plan';
      }
      return 'Current Plan';
    }
    
    if (plan.tier === 'starter') {
      return subscribed ? 'Downgrade' : 'Get Started';
    }
    
    return plan.cta;
  };

  const isCurrentPlan = (plan: typeof plans[0]) => {
    return plan.tier === currentTier;
  };

  return (
    <section id="pricing" className="py-16 sm:py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-8 sm:mb-12">
          <span className="text-accent font-medium text-xs sm:text-sm uppercase tracking-wider">
            Pricing
          </span>
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mt-2 sm:mt-3 mb-3 sm:mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg px-2">
            Choose the plan that fits your business. Upgrade or downgrade anytime.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-8 sm:mb-12">
          <span className={`text-sm font-medium ${!isYearly ? 'text-foreground' : 'text-muted-foreground'}`}>
            Monthly
          </span>
          <Switch
            checked={isYearly}
            onCheckedChange={setIsYearly}
            className="data-[state=checked]:bg-accent"
          />
          <span className={`text-sm font-medium ${isYearly ? 'text-foreground' : 'text-muted-foreground'}`}>
            Yearly
          </span>
          <span className="bg-accent/10 text-accent text-xs font-medium px-2.5 py-1 rounded-full">
            Save 2 months
          </span>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 max-w-7xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative p-6 sm:p-8 rounded-xl sm:rounded-2xl bg-card ${
                plan.popular
                  ? 'ring-2 ring-accent shadow-elevated'
                  : isCurrentPlan(plan)
                  ? 'ring-2 ring-primary shadow-elevated'
                  : 'card-elevated'
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && !isCurrentPlan(plan) && (
                <div className="absolute -top-3 sm:-top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-accent text-accent-foreground text-xs sm:text-sm font-medium px-3 sm:px-4 py-1 rounded-full whitespace-nowrap">
                    Most Popular
                  </span>
                </div>
              )}
              
              {/* Current Plan Badge */}
              {isCurrentPlan(plan) && (
                <div className="absolute -top-3 sm:-top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground text-xs sm:text-sm font-medium px-3 sm:px-4 py-1 rounded-full whitespace-nowrap">
                    Your Plan
                  </span>
                </div>
              )}

              {/* Plan Header */}
              <div className="text-center mb-6 sm:mb-8">
                <h3 className="font-display text-lg sm:text-xl font-semibold text-foreground mb-2">
                  {plan.name}
                </h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="font-display text-3xl sm:text-4xl font-bold text-foreground">
                    {formatPrice(plan)}
                  </span>
                  {getPeriod(plan) && (
                    <span className="text-muted-foreground text-sm">{getPeriod(plan)}</span>
                  )}
                </div>
                {isYearly && getSavingsPercent(plan) && (
                  <p className="text-accent text-sm font-medium mt-1">
                    Save {getSavingsPercent(plan)}%
                  </p>
                )}
                <p className="text-muted-foreground text-sm mt-2 px-2">
                  {plan.description}
                </p>
              </div>

              {/* Features */}
              <ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 sm:gap-3">
                    <div className="w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-accent" />
                    </div>
                    <span className="text-muted-foreground text-sm sm:text-base">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <Button
                variant={plan.popular ? 'accent' : isCurrentPlan(plan) ? 'default' : 'outline'}
                className="w-full"
                size="lg"
                onClick={() => handlePlanAction(plan)}
                disabled={loadingPlan !== null || loading}
              >
                {getButtonText(plan)}
              </Button>
            </div>
          ))}
        </div>

        {/* Money Back Guarantee */}
        <p className="text-center text-muted-foreground text-sm sm:text-base mt-8 sm:mt-12 px-4">
          🛡️ 14-day money-back guarantee on all paid plans. No questions asked.
        </p>
      </div>
    </section>
  );
};

export default PricingSection;
