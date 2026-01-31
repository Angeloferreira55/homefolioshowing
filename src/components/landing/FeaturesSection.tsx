import { Users, Home, Calendar, Share2, FileText, RefreshCw, Route } from 'lucide-react';

const features = [
  {
    icon: Users,
    title: 'Client Hub',
    description: 'Create a dedicated Homefolio for each client. Organize by buyer, seller, or investor with custom nicknames.',
  },
  {
    icon: Home,
    title: 'Property Playlist',
    description: 'Add, reorder, and archive properties easily. Think of it as a curated playlist of homes for each client.',
  },
  {
    icon: Calendar,
    title: 'Showing Notes',
    description: 'Record showing dates, agent observations, and client feedback all in one place for each property.',
  },
  {
    icon: Share2,
    title: 'One Living Link',
    description: 'Share a single private link that updates in real time. Clients refresh to see new properties instantly.',
  },
  {
    icon: FileText,
    title: 'Documents & Photos',
    description: 'Attach MLS PDFs, disclosures, and high-quality photos to each property for complete information.',
  },
  {
    icon: RefreshCw,
    title: 'Real-Time Updates',
    description: 'Update your client\'s Homefolio anytime. Properties can be added, removed, or reordered with ease.',
  },
  {
    icon: Route,
    title: 'Route Optimization',
    description: 'Plan efficient showing routes for multiple properties. Save time and maximize your client visits.',
  },
];

const FeaturesSection = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <span className="text-accent font-medium text-sm uppercase tracking-wider">
            Why HomeFolio
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mt-3 mb-4">
            Your home search, organized
          </h2>
          <p className="text-muted-foreground text-lg">
            Everything your clients need, in one place they can always find.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group p-8 rounded-2xl bg-card card-elevated cursor-default"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-5 group-hover:bg-accent/20 transition-colors">
                <feature.icon className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-display text-xl font-semibold text-foreground mb-3">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
