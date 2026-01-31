import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X, Home } from 'lucide-react';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Home className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-semibold text-foreground">
              HomeFolio
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/features" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
              Features
            </Link>
            <Link to="/pricing" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
              Pricing
            </Link>
            <Link to="/about" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
              About
            </Link>
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link to="/login">Sign In</Link>
            </Button>
            <Button variant="accent" asChild>
              <Link to="/dashboard">Get Started</Link>
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
              <Link
                to="/features"
                className="text-muted-foreground hover:text-foreground transition-colors font-medium px-2 py-2"
                onClick={() => setIsOpen(false)}
              >
                Features
              </Link>
              <Link
                to="/pricing"
                className="text-muted-foreground hover:text-foreground transition-colors font-medium px-2 py-2"
                onClick={() => setIsOpen(false)}
              >
                Pricing
              </Link>
              <Link
                to="/about"
                className="text-muted-foreground hover:text-foreground transition-colors font-medium px-2 py-2"
                onClick={() => setIsOpen(false)}
              >
                About
              </Link>
              <div className="flex flex-col gap-2 pt-4 border-t border-border">
                <Button variant="outline" asChild className="w-full">
                  <Link to="/login" onClick={() => setIsOpen(false)}>Sign In</Link>
                </Button>
                <Button variant="accent" asChild className="w-full">
                  <Link to="/dashboard" onClick={() => setIsOpen(false)}>Get Started</Link>
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
