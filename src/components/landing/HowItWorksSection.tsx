import { UserPlus, Plus, Send, Eye } from 'lucide-react';

const steps = [
  {
    icon: UserPlus,
    step: '01',
    title: 'Create a Client Homefolio',
    description: 'Add your client\'s name and whether they\'re a buyer, seller, or investor. A unique private link is generated automatically.',
  },
  {
    icon: Plus,
    step: '02',
    title: 'Add Properties',
    description: 'Upload photos, add listing details, attach documents like MLS PDFs and disclosures. Record showing notes and observations.',
  },
  {
    icon: Send,
    step: '03',
    title: 'Share the Link',
    description: 'Send your client one link that never changes. They can access their personalized home search anytime.',
  },
  {
    icon: Eye,
    step: '04',
    title: 'Keep It Updated',
    description: 'Add or remove properties as the search evolves. Your client refreshes to see the latest—no resending required.',
  },
];

const HowItWorksSection = () => {
  return (
    <section className="py-24 bg-secondary">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <span className="text-accent font-medium text-sm uppercase tracking-wider">
            How It Works
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mt-3 mb-4">
            Simple for agents, delightful for clients
          </h2>
          <p className="text-muted-foreground text-lg">
            Get started in minutes and transform how you share listings.
          </p>
        </div>

        {/* Steps */}
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            {/* Connecting line */}
            <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px bg-border -translate-x-1/2" />
            
            {steps.map((step, index) => (
              <div
                key={step.step}
                className={`relative flex items-center gap-8 mb-12 last:mb-0 ${
                  index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'
                }`}
              >
                {/* Content */}
                <div className={`flex-1 ${index % 2 === 0 ? 'lg:text-right' : 'lg:text-left'}`}>
                  <div className={`inline-block ${index % 2 === 0 ? 'lg:ml-auto' : ''}`}>
                    <span className="text-accent font-display text-sm font-semibold">
                      Step {step.step}
                    </span>
                    <h3 className="font-display text-xl font-semibold text-foreground mt-1 mb-2">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground max-w-sm">
                      {step.description}
                    </p>
                  </div>
                </div>

                {/* Icon */}
                <div className="relative z-10 flex-shrink-0">
                  <div className="w-16 h-16 rounded-2xl bg-card shadow-card flex items-center justify-center border border-border">
                    <step.icon className="w-7 h-7 text-accent" />
                  </div>
                </div>

                {/* Spacer for alternating layout */}
                <div className="hidden lg:block flex-1" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
