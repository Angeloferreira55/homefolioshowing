import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

const CTASection = () => {
  return (
    <section className="py-16 sm:py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl hero-gradient p-8 sm:p-12 md:p-16 lg:p-20">
          {/* Background pattern */}
          <div 
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }}
          />

          <div className="relative z-10 max-w-3xl mx-auto text-center">
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-4 sm:mb-6 leading-tight">
              Ready to simplify your
              <br className="hidden sm:block" />
              <span className="sm:hidden"> </span>
              client experience?
            </h2>
            <p className="text-primary-foreground/80 text-base sm:text-lg md:text-xl mb-8 sm:mb-10 max-w-xl mx-auto px-2">
              Create your first Homefolio today and give your clients a home search 
              experience they'll love.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <Button size="lg" className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg" asChild>
                <Link to="/auth?mode=signup" className="gap-2">
                  Start for Free
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </Link>
              </Button>
              <Button variant="hero-outline" size="lg" className="w-full sm:w-auto" asChild>
                <Link to="/demo">View Demo</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
