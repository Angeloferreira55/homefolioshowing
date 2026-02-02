import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import SEO from '@/components/SEO';
import { Check, Leaf, Home } from 'lucide-react';

const plans = [
  {
    name: 'Starter',
    description: 'Perfect for trying HomeFolio',
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      'Up to 3 active sessions',
      'Basic property management',
      'Client feedback collection',
      'Mobile-friendly links',
      'Email support',
    ],
    cta: 'Get Started Free',
    popular: false,
  },
  {
    name: 'Pro',
    description: 'For active real estate agents',
    monthlyPrice: 9.99,
    yearlyPrice: 96,
    features: [
      'Unlimited sessions',
      'AI route optimization',
      'Document uploads & sharing',
      'QR code generation',
      'Analytics dashboard',
      'Agent branding & profile',
      'MLS file import',
      'Priority support',
    ],
    cta: 'Start Pro Trial',
    popular: true,
  },
  {
    name: 'Team',
    description: 'For brokerages & teams',
    monthlyPrice: 49,
    yearlyPrice: 470,
    features: [
      'Everything in Pro',
      'Up to 10 agent accounts',
      'Team analytics',
      'Shared document library',
      'Custom branding',
      'Admin dashboard',
      'Dedicated support',
      'API access',
    ],
    cta: 'Contact Sales',
    popular: false,
  },
];

const Pricing = () => {
  const [isYearly, setIsYearly] = useState(true);

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Pricing"
        description="Simple, transparent pricing for HomeFolio. Start free, upgrade when you need more. 14-day free trial on all paid plans."
        url="https://homefolio-central-link.lovable.app/pricing"
      />
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-16 bg-gradient-to-b from-secondary to-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 rounded-full mb-6">
            <Leaf className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium text-accent">
              Save a Tree, Save Money
            </span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-6">
            Simple, Transparent{' '}
            <span className="text-accent">Pricing</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Choose the plan that fits your business. All plans include a 14-day
            free trial.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <span
              className={`text-sm font-medium ${
                !isYearly ? 'text-foreground' : 'text-muted-foreground'
              }`}
            >
              Monthly
            </span>
            <Switch checked={isYearly} onCheckedChange={setIsYearly} />
            <span
              className={`text-sm font-medium ${
                isYearly ? 'text-foreground' : 'text-muted-foreground'
              }`}
            >
              Yearly
            </span>
            {isYearly && (
              <span className="ml-2 px-3 py-1 bg-accent text-accent-foreground text-xs font-bold rounded-full">
                Save 20%
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-12 -mt-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative bg-card rounded-2xl p-8 ${
                  plan.popular
                    ? 'ring-2 ring-accent shadow-xl scale-105'
                    : 'card-elevated'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-accent text-accent-foreground text-sm font-bold rounded-full">
                    Most Popular
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="font-display text-2xl font-bold text-foreground mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {plan.description}
                  </p>
                </div>

                <div className="text-center mb-6">
                  <span className="font-display text-5xl font-bold text-foreground">
                    ${isYearly ? Math.round(plan.yearlyPrice / 12) : plan.monthlyPrice}
                  </span>
                  <span className="text-muted-foreground">/month</span>
                  {isYearly && plan.yearlyPrice > 0 && (
                    <p className="text-sm text-muted-foreground mt-1">
                      ${plan.yearlyPrice} billed yearly
                    </p>
                  )}
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                      <span className="text-foreground text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link to="/auth">
                  <Button
                    className="w-full"
                    variant={plan.popular ? 'default' : 'outline'}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Preview */}
      <section className="py-20 bg-secondary">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-3xl font-bold text-foreground mb-4">
            Questions?
          </h2>
          <p className="text-muted-foreground mb-6">
            Check out our FAQ or reach out to our support team.
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/#faq">
              <Button variant="outline">View FAQ</Button>
            </Link>
            <Link to="/contact">
              <Button>Contact Us</Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Pricing;
