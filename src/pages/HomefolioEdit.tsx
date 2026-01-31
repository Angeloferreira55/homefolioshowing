import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { mockHomefolios } from '@/lib/mockData';
import { Property } from '@/types/homefolio';
import { Button } from '@/components/ui/button';
import PropertyCard from '@/components/homefolio/PropertyCard';
import PropertyDetail from '@/components/homefolio/PropertyDetail';
import {
  Home,
  ArrowLeft,
  Plus,
  Share2,
  ExternalLink,
  Copy,
  Grid,
  List,
} from 'lucide-react';
import { toast } from 'sonner';

const HomefolioEdit = () => {
  const { id } = useParams();
  const homefolio = mockHomefolios.find((h) => h.id === id);
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  if (!homefolio) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-display text-2xl font-bold text-foreground mb-2">
            Homefolio not found
          </h2>
          <Button asChild>
            <Link to="/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/view/${homefolio.privateLink}`);
    toast.success('Link copied to clipboard!');
  };

  const handleViewProperty = (property: Property) => {
    setSelectedProperty(property);
    setIsDetailOpen(true);
  };

  const handleArchiveProperty = (property: Property) => {
    toast.success(`${property.address} archived`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" asChild>
                <Link to="/dashboard">
                  <ArrowLeft className="w-5 h-5" />
                </Link>
              </Button>
              <Link to="/" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <Home className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="font-display text-xl font-semibold text-foreground hidden sm:inline">
                  HomeFolio
                </span>
              </Link>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={copyLink}>
                <Copy className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Copy Link</span>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link to={`/view/${homefolio.privateLink}`} target="_blank">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Preview</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground mb-1">
              {homefolio.clientName}
            </h1>
            {homefolio.clientNickname && (
              <p className="text-muted-foreground">{homefolio.clientNickname}</p>
            )}
            <div className="flex items-center gap-2 mt-3">
              <span className="px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium capitalize">
                {homefolio.clientType}
              </span>
              <span className="text-sm text-muted-foreground">
                {homefolio.properties.length} {homefolio.properties.length === 1 ? 'property' : 'properties'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center border border-border rounded-lg p-1">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
            <Button variant="accent">
              <Plus className="w-4 h-4 mr-2" />
              Add Property
            </Button>
          </div>
        </div>

        {/* Private Link Banner */}
        <div className="mb-8 p-4 rounded-xl bg-secondary flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Share2 className="w-5 h-5 text-accent" />
            <div>
              <p className="font-medium text-foreground text-sm">Private Client Link</p>
              <p className="text-xs text-muted-foreground">
                {window.location.origin}/view/{homefolio.privateLink}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={copyLink}>
            <Copy className="w-4 h-4 mr-2" />
            Copy
          </Button>
        </div>

        {/* Properties Grid */}
        {homefolio.properties.length > 0 ? (
          <div className={`grid gap-6 ${
            viewMode === 'grid'
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
              : 'grid-cols-1'
          }`}>
            {homefolio.properties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                onView={handleViewProperty}
                onArchive={handleArchiveProperty}
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
            <p className="text-muted-foreground mb-6">
              Start adding properties for {homefolio.clientName}
            </p>
            <Button variant="accent">
              <Plus className="w-4 h-4 mr-2" />
              Add First Property
            </Button>
          </div>
        )}
      </main>

      <PropertyDetail
        property={selectedProperty}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
      />
    </div>
  );
};

export default HomefolioEdit;
