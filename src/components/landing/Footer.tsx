import { Link } from 'react-router-dom';
import logoImage from '@/assets/homefolio-logo.png';
const Footer = () => {
  return <footer className="bg-primary text-primary-foreground py-8 sm:py-12 safe-area-bottom">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-6 sm:mb-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="inline-block mb-3">
              <img src={logoImage} alt="HomeFolio" className="h-16 sm:h-20 w-auto brightness-0 invert" />
            </Link>
            <p className="text-primary-foreground/70 text-sm leading-relaxed">Everything your clients need, in one place they can always find.</p>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold text-sm mb-2.5">Product</h4>
            <ul className="space-y-1.5">
              <li>
                <Link to="/features" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm">
                  Features
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm">
                  Pricing
                </Link>
              </li>
              <li>
                <Link to="/demo" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm">
                  Demo
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-sm mb-2.5">Company</h4>
            <ul className="space-y-1.5">
              <li>
                <Link to="/about" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm">
                  About
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm">
                  Blog
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-sm mb-2.5">Legal</h4>
            <ul className="space-y-1.5">
              <li>
                <Link to="/privacy" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/eula" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm">
                  EULA
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-5 border-t border-primary-foreground/20">
          <p className="text-center text-primary-foreground/60 text-xs">
            © {new Date().getFullYear()} HomeFolio. All rights reserved.
          </p>
        </div>
      </div>
    </footer>;
};
export default Footer;