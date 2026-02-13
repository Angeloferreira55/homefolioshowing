import { Users, Home, Calendar, FileText, Route, TreePine } from 'lucide-react';
const features = [{
  icon: Users,
  title: 'Client Hub',
  description: 'Create a dedicated Homefolio for each client. Organize by buyer, seller, or investor with custom nicknames.'
}, {
  icon: Home,
  title: 'Property Playlist',
  description: 'Add, reorder, and archive properties easily. Think of it as a curated playlist of homes for each client.'
}, {
  icon: Calendar,
  title: 'Showing Notes',
  description: 'Record showing dates, agent observations, and client feedback all in one place for each property.'
}, {
  icon: FileText,
  title: 'Documents & Photos',
  description: 'Attach MLS PDFs, disclosures, and any document you want to share with your customer for each property in a few simple steps.'
}, {
  icon: Route,
  title: 'Route Optimization',
  description: 'Plan efficient showing routes for multiple properties. Save time and maximize your client visits.'
}, {
  icon: TreePine,
  title: 'Save a Tree and Money',
  description: 'Go paperless with digital documents and links. No more printing stacks of MLS sheets for every showing.'
}];
const FeaturesSection = () => {
  return <section id="features" className="py-16 sm:py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-10 sm:mb-16">
          <span className="text-accent font-medium text-xs sm:text-sm uppercase tracking-wider">
            Why HomeFolio
          </span>
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mt-2 sm:mt-3 mb-3 sm:mb-4">Your Showings Organized</h2>
          <p className="text-muted-foreground text-base sm:text-lg px-2">
            Everything your clients need, in one place they can always find.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {features.map((feature, index) => <div key={feature.title} className="group p-5 sm:p-6 lg:p-8 rounded-xl sm:rounded-2xl bg-card card-elevated cursor-default" style={{
          animationDelay: `${index * 0.1}s`
        }}>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-accent/10 flex items-center justify-center mb-4 sm:mb-5 group-hover:bg-accent/20 transition-colors">
                <feature.icon className="w-5 h-5 sm:w-6 sm:h-6 text-accent" />
              </div>
              <h3 className="font-display text-lg sm:text-xl font-semibold text-foreground mb-2 sm:mb-3">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                {feature.description}
              </p>
            </div>)}
        </div>

        {/* Bottom CTA text */}
        <div className="max-w-2xl mx-auto text-center mt-10 sm:mt-16 px-4">
          <p className="text-base sm:text-lg text-muted-foreground">
            Get started in minutes and transform how you share listings 
            and organize your showings with your clients.
          </p>
        </div>
      </div>
    </section>;
};
export default FeaturesSection;