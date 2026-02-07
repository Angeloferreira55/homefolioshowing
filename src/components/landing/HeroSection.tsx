import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Link2, RefreshCw, Users, Route } from 'lucide-react';

const HeroSection = () => {
  return (
    <section className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 hero-gradient" />
      
      {/* Subtle pattern overlay */}
      <div 
        className="absolute inset-0 opacity-5" 
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} 
      />

      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-12 sm:pb-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20 mb-6 sm:mb-8 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-primary-foreground/90 text-xs sm:text-sm font-medium">
              Homefolio — Your Showing Hub
            </span>
          </div>

          {/* Headline */}
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-primary-foreground mb-4 sm:mb-6 animate-slide-up opacity-0 stagger-1 leading-tight">
            <span className="relative inline-block">
              One link
              <svg className="absolute -bottom-1 sm:-bottom-2 left-0 w-full" viewBox="0 0 200 12" fill="none">
                <path d="M2 10C50 4 150 4 198 10" stroke="hsl(210 65% 28%)" strokeWidth="4" strokeLinecap="round" />
              </svg>
            </span>
            {' '}built by agents,
            <br />
            for their clients.
          </h1>

          {/* Subheadline */}
          <p className="text-base sm:text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto mb-8 sm:mb-10 animate-slide-up opacity-0 stagger-2 font-body px-2">
            HomeFolio is a private, living link for real estate professionals.
            Properties updated in real time. No paper. No clutter. No lost files.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-10 sm:mb-16 animate-slide-up opacity-0 stagger-3 px-4 sm:px-0">
            <Button variant="hero" size="lg" className="w-full sm:w-auto text-base" asChild>
              <Link to="/auth?mode=signup" className="gap-2">
                Start for Free
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </Link>
            </Button>
            <Button variant="hero-outline" size="lg" className="w-full sm:w-auto text-base" asChild>
              <Link to="/demo">See It In Action</Link>
            </Button>
          </div>

          {/* Feature Pills */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-center gap-2 sm:gap-4 animate-slide-up opacity-0 stagger-4 px-2 sm:px-0">
            <div className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-full bg-primary-foreground/10 backdrop-blur-sm">
              <Link2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent flex-shrink-0" />
              <span className="text-primary-foreground/90 text-xs sm:text-sm whitespace-nowrap">One Private Link</span>
            </div>
            <div className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-full bg-primary-foreground/10 backdrop-blur-sm">
              <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent flex-shrink-0" />
              <span className="text-primary-foreground/90 text-xs sm:text-sm whitespace-nowrap">Real-Time Updates</span>
            </div>
            <div className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-full bg-primary-foreground/10 backdrop-blur-sm">
              <Route className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent flex-shrink-0" />
              <span className="text-primary-foreground/90 text-xs sm:text-sm whitespace-nowrap">Route Optimization</span>
            </div>
            <div className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-full bg-primary-foreground/10 backdrop-blur-sm">
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent flex-shrink-0" />
              <span className="text-primary-foreground/90 text-xs sm:text-sm whitespace-nowrap">Client-Centric</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 sm:h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default HeroSection;