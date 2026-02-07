import { useState } from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Link } from 'react-router-dom';

const plans = [
  {
    name: 'Starter',
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
    cta: 'Start Free Trial',
    popular: true,
  },
  {
    name: 'Team',
    monthlyPrice: 75,
    yearlyPrice: 720,
    description: 'For brokerages and real estate teams',
    features: [
      'Everything in Pro',
      'Up to 10 brokers',
      'Team analytics dashboard',
      'Client handoff between agents',
      'Custom branding',
      'API access',
      'Dedicated account manager',
    ],
    cta: 'Contact Sales',
    popular: false,
  },
];

const PricingSection = () => {
  const [isYearly, setIsYearly] = useState(false);

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative p-6 sm:p-8 rounded-xl sm:rounded-2xl bg-card ${
                plan.popular
                  ? 'ring-2 ring-accent shadow-elevated'
                  : 'card-elevated'
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-3 sm:-top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-accent text-accent-foreground text-xs sm:text-sm font-medium px-3 sm:px-4 py-1 rounded-full whitespace-nowrap">
                    Most Popular
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
                variant={plan.popular ? 'accent' : 'outline'}
                className="w-full"
                size="lg"
                asChild
              >
                <Link to="/auth">{plan.cta}</Link>
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
