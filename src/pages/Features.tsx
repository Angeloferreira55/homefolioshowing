import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import SEO from '@/components/SEO';
import {
  Home,
  Link2,
  FileText,
  Route,
  Star,
  BarChart3,
  QrCode,
  Upload,
  Shield,
  Smartphone,
  Clock,
  Users,
} from 'lucide-react';

const features = [
  {
    icon: Link2,
    title: 'One Link Per Client',
    description:
      'Create a unique, branded link for each client. Share it once, and they can access all their showing properties anytime.',
    color: 'bg-accent',
  },
  {
    icon: FileText,
    title: 'Document Management',
    description:
      'Upload disclosures, inspections, floor plans, and HOA docs directly to each property. Clients can view them on the go.',
    color: 'bg-primary',
  },
  {
    icon: Route,
    title: 'AI Route Optimization',
    description:
      'Our AI calculates the most efficient driving route between properties, saving you time and gas on showing day.',
    color: 'bg-accent',
  },
  {
    icon: Star,
    title: 'Client Feedback & Ratings',
    description:
      'Clients can rate properties 1-10, leave detailed feedback, and indicate next steps—all from their phone.',
    color: 'bg-primary',
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    description:
      'Track session views, property interest, document downloads, and engagement patterns across all your clients.',
    color: 'bg-accent',
  },
  {
    icon: QrCode,
    title: 'QR Code Generation',
    description:
      'Generate QR codes for each session. Print them for open houses or include in marketing materials.',
    color: 'bg-primary',
  },
  {
    icon: Upload,
    title: 'MLS Import',
    description:
      'Import properties directly from MLS files (PDF, CSV, Excel) or paste a Realtor.com URL to auto-populate listings.',
    color: 'bg-accent',
  },
  {
    icon: Shield,
    title: 'Secure & Private',
    description:
      'Each session has a unique token. Only people with the link can view properties. No account required for clients.',
    color: 'bg-primary',
  },
  {
    icon: Smartphone,
    title: 'Mobile-First Design',
    description:
      'Built for agents and clients on the go. The entire experience is optimized for phones and tablets.',
    color: 'bg-accent',
  },
  {
    icon: Clock,
    title: 'Real-Time Updates',
    description:
      'Add or remove properties, upload documents, and changes appear instantly for your clients.',
    color: 'bg-primary',
  },
  {
    icon: Users,
    title: 'Agent Branding',
    description:
      'Your profile, photo, brokerage logo, and contact info appear on every client session—building your brand.',
    color: 'bg-accent',
  },
];

const Features = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Features"
        description="Discover all the features HomeFolio offers: AI route optimization, document management, client feedback, analytics, and more."
        url="https://homefolio-central-link.lovable.app/features"
      />
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-16 bg-gradient-to-b from-secondary to-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 rounded-full mb-6">
            <Home className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium text-accent">
              Everything You Need
            </span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-6">
            Features Built for{' '}
            <span className="text-accent">Real Estate Agents</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            HomeFolio streamlines your showing workflow from start to finish.
            Less paperwork, more closings.
          </p>
          <Link to="/auth">
            <Button size="lg" className="gap-2">
              Get Started Free
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-card rounded-2xl p-6 card-elevated hover:shadow-lg transition-shadow"
              >
                <div
                  className={`w-12 h-12 ${feature.color} rounded-xl flex items-center justify-center mb-4`}
                >
                  <feature.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-6">
            Ready to Transform Your Showings?
          </h2>
          <p className="text-primary-foreground/80 text-lg mb-8 max-w-xl mx-auto">
            Join hundreds of agents who've simplified their workflow with
            HomeFolio.
          </p>
          <Link to="/auth">
            <Button
              size="lg"
              variant="secondary"
              className="bg-background text-primary hover:bg-background/90"
            >
              Start Free Today
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Features;
