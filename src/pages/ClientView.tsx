import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { mockHomefolios, mockAgent } from '@/lib/mockData';
import { Property } from '@/types/homefolio';
import PropertyCard from '@/components/homefolio/PropertyCard';
import PropertyDetail from '@/components/homefolio/PropertyDetail';
import { Home, User, Phone, Mail } from 'lucide-react';

const ClientView = () => {
  const { link } = useParams();
  const homefolio = mockHomefolios.find((h) => h.privateLink === link);

  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  if (!homefolio) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center px-4">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <Home className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="font-display text-2xl font-bold text-foreground mb-2">
            Homefolio not found
          </h2>
          <p className="text-muted-foreground">
            This link may be invalid or the homefolio may have been removed.
          </p>
        </div>
      </div>
    );
  }

  const handleViewProperty = (property: Property) => {
    setSelectedProperty(property);
    setIsDetailOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground py-8 sm:py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-primary-foreground flex items-center justify-center">
              <Home className="w-4 h-4 text-primary" />
            </div>
            <span className="font-display text-lg font-semibold">HomeFolio</span>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl font-bold mb-2">
            {homefolio.clientName}'s Home Search
          </h1>
          <p className="text-primary-foreground/80 text-lg">
            Curated by {mockAgent.name}
          </p>

          <div className="flex flex-wrap items-center gap-4 mt-6 pt-6 border-t border-primary-foreground/20">
            <div className="flex items-center gap-2 text-sm text-primary-foreground/80">
              <User className="w-4 h-4" />
              {mockAgent.company}
            </div>
            {mockAgent.phone && (
              <a
                href={`tel:${mockAgent.phone}`}
                className="flex items-center gap-2 text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors"
              >
                <Phone className="w-4 h-4" />
                {mockAgent.phone}
              </a>
            )}
            <a
              href={`mailto:${mockAgent.email}`}
              className="flex items-center gap-2 text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors"
            >
              <Mail className="w-4 h-4" />
              {mockAgent.email}
            </a>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Properties Count */}
        <div className="mb-8">
          <p className="text-muted-foreground">
            {homefolio.properties.length}{' '}
            {homefolio.properties.length === 1 ? 'property' : 'properties'} curated for you
          </p>
        </div>

        {/* Properties Grid */}
        {homefolio.properties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {homefolio.properties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                onView={handleViewProperty}
                isClientView
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <Home className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-display text-xl font-semibold text-foreground mb-2">
              No properties yet
            </h3>
            <p className="text-muted-foreground">
              Your agent will add properties soon. Check back later!
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
                <Home className="w-3 h-3 text-primary-foreground" />
              </div>
              <span className="text-sm text-muted-foreground">Powered by HomeFolio</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Last updated {new Date(homefolio.updatedAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </footer>

      <PropertyDetail
        property={selectedProperty}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        isClientView
      />
    </div>
  );
};

export default ClientView;
