import { User, Plus, MapPin, Send } from 'lucide-react';

const steps = [
  {
    icon: User,
    step: '01',
    title: 'Set Up Your Profile',
    description: 'Add your photo, bio, brokerage info, license number, and social media links. Your branding appears on every session you share with clients.',
  },
  {
    icon: Plus,
    step: '02',
    title: 'Create a Session & Add Properties',
    description: 'Create a showing session for your client, then add properties by uploading an MLS PDF with a photo, pasting a Realtor.com link, or entering details manually. Attach documents and notes to each property.',
  },
  {
    icon: MapPin,
    step: '03',
    title: 'Optimize Your Route & Schedule',
    description: 'Generate the most efficient driving route between properties based on your starting location, then use the estimated travel times to schedule showing times for each home.',
  },
  {
    icon: Send,
    step: '04',
    title: 'Share with Your Client',
    description: 'Send your client one password-protected link. They can view properties, access documents, get directions, leave ratings, and provide feedback — all from their phone.',
  },
];

const HowItWorksSection = () => {
  return (
    <section className="py-16 sm:py-24 bg-secondary">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-10 sm:mb-16">
          <span className="text-accent font-medium text-xs sm:text-sm uppercase tracking-wider">
            How It Works
          </span>
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mt-2 sm:mt-3 mb-3 sm:mb-4">
            Simple for agents, delightful for clients
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg px-2">
            Get started in minutes and transform how you organize your showings.
          </p>
        </div>

        {/* Steps - Mobile: Vertical timeline, Desktop: Alternating */}
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            {/* Connecting line - visible on all sizes */}
            <div className="absolute left-6 sm:left-8 lg:left-1/2 top-0 bottom-0 w-px bg-border lg:-translate-x-1/2" />
            
            {steps.map((step, index) => (
              <div
                key={step.step}
                className={`relative flex items-start gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-12 last:mb-0 ${
                  index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'
                }`}
              >
                {/* Icon - Left side on mobile, center on desktop */}
                <div className="relative z-10 flex-shrink-0">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-xl sm:rounded-2xl bg-card shadow-card flex items-center justify-center border border-border">
                    <step.icon className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-accent" />
                  </div>
                </div>

                {/* Content */}
                <div className={`flex-1 pt-1 lg:pt-0 ${index % 2 === 0 ? 'lg:text-right' : 'lg:text-left'}`}>
                  <div className={`${index % 2 === 0 ? 'lg:ml-auto' : ''}`}>
                    <span className="text-accent font-display text-xs sm:text-sm font-semibold">
                      Step {step.step}
                    </span>
                    <h3 className="font-display text-lg sm:text-xl font-semibold text-foreground mt-1 mb-2">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground text-sm sm:text-base max-w-sm">
                      {step.description}
                    </p>
                  </div>
                </div>

                {/* Spacer for alternating layout - desktop only */}
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
