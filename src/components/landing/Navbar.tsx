import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import ThemeToggle from '@/components/ui/ThemeToggle';
import logoImage from '@/assets/homefolio-logo.png';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const scrollToSection = (sectionId: string) => {
    setIsOpen(false);
    
    // If not on home page, navigate there first
    if (location.pathname !== '/') {
      navigate('/');
      // Wait for navigation then scroll
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        element?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const element = document.getElementById(sectionId);
      element?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/">
            <img 
              src={logoImage} 
              alt="HomeFolio" 
              className="h-20 w-auto dark:brightness-0 dark:invert"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <button
              onClick={() => scrollToSection('features')}
              className="text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('pricing')}
              className="text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              Pricing
            </button>
            <button
              onClick={() => scrollToSection('faq')}
              className="text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              FAQ
            </button>
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            <Button variant="ghost" asChild>
              <Link to="/auth">Sign In</Link>
            </Button>
            <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Link to="/admin/showings">Get Started</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? (
              <X className="w-6 h-6 text-foreground" />
            ) : (
              <Menu className="w-6 h-6 text-foreground" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-border animate-fade-in">
            <div className="flex flex-col gap-4">
              <button
                onClick={() => scrollToSection('features')}
                className="text-muted-foreground hover:text-foreground transition-colors font-medium px-2 py-2 text-left"
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection('pricing')}
                className="text-muted-foreground hover:text-foreground transition-colors font-medium px-2 py-2 text-left"
              >
                Pricing
              </button>
              <button
                onClick={() => scrollToSection('faq')}
                className="text-muted-foreground hover:text-foreground transition-colors font-medium px-2 py-2 text-left"
              >
                FAQ
              </button>
              <div className="flex flex-col gap-2 pt-4 border-t border-border">
                <div className="flex justify-center pb-2">
                  <ThemeToggle />
                </div>
                <Button variant="outline" asChild className="w-full">
                  <Link to="/auth" onClick={() => setIsOpen(false)}>Sign In</Link>
                </Button>
                <Button asChild className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                  <Link to="/admin/showings" onClick={() => setIsOpen(false)}>Get Started</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
