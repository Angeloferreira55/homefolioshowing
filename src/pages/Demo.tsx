import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  ArrowRight, 
  User, 
  Home, 
  FileText, 
  Route, 
  MessageSquare,
  CheckCircle2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import SEO from '@/components/SEO';

interface DemoStep {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
  mockScreen: React.ReactNode;
}

const ProfileMockup = () => (
  <div className="bg-card rounded-lg border shadow-sm p-6 space-y-4">
    <div className="flex items-center gap-4">
      <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
        <User className="w-10 h-10 text-muted-foreground" />
      </div>
      <div className="space-y-2">
        <div className="h-5 w-32 bg-muted rounded animate-pulse" />
        <div className="h-4 w-48 bg-muted/60 rounded animate-pulse" />
      </div>
    </div>
    <div className="grid grid-cols-2 gap-4 pt-4">
      <div className="space-y-2">
        <div className="text-xs text-muted-foreground">Email</div>
        <div className="h-9 bg-muted/40 rounded border px-3 flex items-center">
          <span className="text-sm text-foreground">agent@realty.com</span>
        </div>
      </div>
      <div className="space-y-2">
        <div className="text-xs text-muted-foreground">Phone</div>
        <div className="h-9 bg-muted/40 rounded border px-3 flex items-center">
          <span className="text-sm text-foreground">(555) 123-4567</span>
        </div>
      </div>
      <div className="space-y-2">
        <div className="text-xs text-muted-foreground">Brokerage</div>
        <div className="h-9 bg-muted/40 rounded border px-3 flex items-center">
          <span className="text-sm text-foreground">Premier Properties</span>
        </div>
      </div>
      <div className="space-y-2">
        <div className="text-xs text-muted-foreground">License #</div>
        <div className="h-9 bg-muted/40 rounded border px-3 flex items-center">
          <span className="text-sm text-foreground">DRE-1234567</span>
        </div>
      </div>
    </div>
    <Button className="w-full mt-4" size="sm">Save Profile</Button>
  </div>
);

const ListingsMockup = () => (
  <div className="bg-card rounded-lg border shadow-sm p-4 space-y-3">
    <div className="flex items-center justify-between">
      <h4 className="font-semibold text-sm">Client Properties</h4>
      <Button size="sm" variant="outline" className="h-7 text-xs">+ Add Property</Button>
    </div>
    {[
      { address: '123 Oak Street', price: '$425,000', beds: 3, baths: 2, status: 'Active' },
      { address: '456 Maple Avenue', price: '$675,000', beds: 4, baths: 3, status: 'Active' },
      { address: '789 Pine Road', price: '$525,000', beds: 3, baths: 2.5, status: 'Pending' },
    ].map((prop, i) => (
      <div key={i} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border">
        <div className="w-16 h-12 bg-muted rounded flex items-center justify-center">
          <Home className="w-6 h-6 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{prop.address}</div>
          <div className="text-xs text-muted-foreground">{prop.beds} bed • {prop.baths} bath</div>
        </div>
        <div className="text-right">
          <div className="font-semibold text-sm text-primary">{prop.price}</div>
          <Badge variant={prop.status === 'Active' ? 'default' : 'secondary'} className="text-xs">
            {prop.status}
          </Badge>
        </div>
      </div>
    ))}
  </div>
);

const DocumentsMockup = () => (
  <div className="bg-card rounded-lg border shadow-sm p-4 space-y-3">
    <div className="flex items-center justify-between">
      <h4 className="font-semibold text-sm">Property Documents</h4>
      <Button size="sm" variant="outline" className="h-7 text-xs">Upload</Button>
    </div>
    <div className="space-y-2">
      {[
        { name: 'Disclosure Package.pdf', type: 'Disclosure', size: '2.4 MB' },
        { name: 'Inspection Report.pdf', type: 'Report', size: '1.8 MB' },
        { name: 'Floor Plan.pdf', type: 'Floor Plan', size: '856 KB' },
        { name: 'HOA Docs.pdf', type: 'HOA', size: '3.2 MB' },
      ].map((doc, i) => (
        <div key={i} className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded-lg transition-colors">
          <div className="w-10 h-10 bg-accent/10 rounded flex items-center justify-center">
            <FileText className="w-5 h-5 text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm truncate">{doc.name}</div>
            <div className="text-xs text-muted-foreground">{doc.size}</div>
          </div>
          <Badge variant="outline" className="text-xs">{doc.type}</Badge>
        </div>
      ))}
    </div>
  </div>
);

const RouteMockup = () => (
  <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
    <div className="h-32 bg-gradient-to-br from-muted to-muted/50 relative">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center text-sm font-bold">1</div>
          <div className="w-16 h-0.5 bg-accent/50" />
          <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center text-sm font-bold">2</div>
          <div className="w-16 h-0.5 bg-accent/50" />
          <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center text-sm font-bold">3</div>
        </div>
      </div>
      <div className="absolute top-2 right-2">
        <Badge className="bg-accent text-white text-xs">AI Optimized</Badge>
      </div>
    </div>
    <div className="p-4 space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Total Distance</span>
        <span className="font-semibold">12.4 miles</span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Estimated Time</span>
        <span className="font-semibold">45 min</span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Properties</span>
        <span className="font-semibold">3 stops</span>
      </div>
      <Button className="w-full mt-2" size="sm">
        <Route className="w-4 h-4 mr-2" />
        Optimize Route
      </Button>
    </div>
  </div>
);

const FeedbackMockup = () => (
  <div className="bg-card rounded-lg border shadow-sm p-4 space-y-4">
    <h4 className="font-semibold text-sm">Client Feedback</h4>
    {[
      { address: '123 Oak Street', rating: 5, comment: 'Love the backyard!' },
      { address: '456 Maple Avenue', rating: 4, comment: 'Great layout, small kitchen' },
      { address: '789 Pine Road', rating: 3, comment: 'Nice but needs updates' },
    ].map((feedback, i) => (
      <div key={i} className="p-3 bg-muted/30 rounded-lg space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-medium text-sm">{feedback.address}</span>
          <div className="flex gap-0.5">
            {[...Array(5)].map((_, j) => (
              <div 
                key={j} 
                className={`w-4 h-4 rounded-full ${j < feedback.rating ? 'bg-accent' : 'bg-muted'}`}
              />
            ))}
          </div>
        </div>
        <div className="flex items-start gap-2">
          <MessageSquare className="w-4 h-4 text-muted-foreground mt-0.5" />
          <p className="text-sm text-muted-foreground italic">"{feedback.comment}"</p>
        </div>
      </div>
    ))}
  </div>
);

const demoSteps: DemoStep[] = [
  {
    id: 1,
    title: 'Set Up Your Profile',
    description: 'Create your professional agent profile with brokerage info, contact details, and personal branding that appears on every client link.',
    icon: <User className="w-6 h-6" />,
    features: [
      'Professional photo and bio',
      'Brokerage branding',
      'Contact information',
      'Social media links'
    ],
    mockScreen: <ProfileMockup />
  },
  {
    id: 2,
    title: 'Add Property Listings',
    description: 'Curate properties for each client by adding listings with photos, details, and pricing. Import from MLS or add manually.',
    icon: <Home className="w-6 h-6" />,
    features: [
      'MLS import support',
      'Photo galleries',
      'Property details',
      'Price tracking'
    ],
    mockScreen: <ListingsMockup />
  },
  {
    id: 3,
    title: 'Attach Documents',
    description: 'Upload disclosure packages, inspection reports, floor plans, and any relevant documents for each property.',
    icon: <FileText className="w-6 h-6" />,
    features: [
      'Multiple file types',
      'Organized by property',
      'Client accessible',
      'Secure storage'
    ],
    mockScreen: <DocumentsMockup />
  },
  {
    id: 4,
    title: 'Optimize Your Route',
    description: 'AI-powered route optimization helps you plan efficient showing tours, saving time and reducing drive time between properties.',
    icon: <Route className="w-6 h-6" />,
    features: [
      'AI-powered optimization',
      'Time estimates',
      'Turn-by-turn directions',
      'One-click reorder'
    ],
    mockScreen: <RouteMockup />
  },
  {
    id: 5,
    title: 'Collect Client Feedback',
    description: 'Clients can rate properties and leave notes directly in their link. Review feedback to refine your property recommendations.',
    icon: <MessageSquare className="w-6 h-6" />,
    features: [
      'Star ratings',
      'Written feedback',
      'Real-time sync',
      'Export reports'
    ],
    mockScreen: <FeedbackMockup />
  }
];

const Demo = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const step = demoSteps[currentStep];

  const goToStep = (index: number) => {
    if (index >= 0 && index < demoSteps.length) {
      setCurrentStep(index);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Demo"
        description="See how HomeFolio works with our interactive demo. Walk through the complete workflow from profile setup to client feedback."
        url="https://homefolio-central-link.lovable.app/demo"
      />
      <Navbar />
      
      <main className="pt-24 pb-16">
        {/* Header */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 mb-12">
          <div className="max-w-3xl mx-auto text-center">
            <Badge variant="outline" className="mb-4">Interactive Demo</Badge>
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">
              See How HomeFolio Works
            </h1>
            <p className="text-lg text-muted-foreground">
              Walk through the complete workflow — from setting up your profile to collecting client feedback.
            </p>
          </div>
        </section>

        {/* Step Navigation */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 mb-8">
          <div className="flex items-center justify-center gap-2 overflow-x-auto pb-4">
            {demoSteps.map((s, i) => (
              <button
                key={s.id}
                onClick={() => goToStep(i)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all whitespace-nowrap ${
                  i === currentStep
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                <span className="w-6 h-6 rounded-full bg-background/20 flex items-center justify-center text-sm font-medium">
                  {i + 1}
                </span>
                <span className="hidden sm:inline text-sm font-medium">{s.title}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Demo Content */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <Card className="overflow-hidden border-2">
              <CardContent className="p-0">
                <div className="grid lg:grid-cols-2">
                  {/* Left: Description */}
                  <div className="p-8 lg:p-12 flex flex-col justify-center bg-gradient-to-br from-muted/30 to-background">
                    <div className="inline-flex items-center gap-2 text-accent mb-4">
                      <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                        {step.icon}
                      </div>
                      <Badge variant="secondary">Step {step.id} of {demoSteps.length}</Badge>
                    </div>
                    
                    <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-4">
                      {step.title}
                    </h2>
                    
                    <p className="text-muted-foreground mb-6">
                      {step.description}
                    </p>
                    
                    <ul className="space-y-3 mb-8">
                      {step.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-3 text-sm">
                          <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Navigation */}
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => goToStep(currentStep - 1)}
                        disabled={currentStep === 0}
                        className="gap-1"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => goToStep(currentStep + 1)}
                        disabled={currentStep === demoSteps.length - 1}
                        className="gap-1"
                      >
                        Next
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Right: Mock Screen */}
                  <div className="p-6 lg:p-8 bg-muted/20 flex items-center justify-center">
                    <div className="w-full max-w-sm">
                      {step.mockScreen}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 mt-16">
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="font-display text-2xl font-bold text-foreground mb-4">
              Ready to Get Started?
            </h3>
            <p className="text-muted-foreground mb-6">
              Create your first HomeFolio in minutes and impress your clients with a professional, always-updated property link.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" asChild>
                <Link to="/dashboard" className="gap-2">
                  Start Your First Homefolio
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/" className="gap-2">
                  <ArrowLeft className="w-5 h-5" />
                  Back to Home
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Demo;
