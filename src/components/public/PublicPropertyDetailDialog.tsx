import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  MapPin, 
  X, 
  FileText, 
  Bed, 
  Bath, 
  Square, 
  CalendarDays, 
  Tag, 
  DollarSign, 
  Car,
  Sparkles,
  ZoomIn
} from 'lucide-react';
import PropertyDocumentsDrawer from './PropertyDocumentsDrawer';
import { ImageGallery } from '@/components/ui/image-gallery';
import MortgageCalculator from './MortgageCalculator';

export interface PublicPropertyDocument {
  id: string;
  name: string;
  doc_type: string | null;
  file_url: string;
}

export interface PublicSessionProperty {
  id: string;
  address: string;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  price: number | null;
  beds: number | null;
  baths: number | null;
  sqft: number | null;
  photo_url: string | null;
  photo_urls?: string[] | null;
  documents?: PublicPropertyDocument[];
  agent_notes?: string | null;
  summary?: string | null;
  description?: string | null;
  year_built?: number | null;
  lot_size?: string | null;
  property_type?: string | null;
  hoa_fee?: number | null;
  garage?: string | null;
  heating?: string | null;
  cooling?: string | null;
  features?: string[] | null;
}

interface AgentInfo {
  name?: string;
  title?: string;
  avatarUrl?: string;
  message?: string;
}

function formatPrice(price: number | null) {
  if (!price) return null;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(price);
}

function formatMonthlyPayment(price: number | null) {
  if (!price) return null;
  // Rough estimate: 30-year mortgage at ~7% rate
  const monthlyRate = 0.07 / 12;
  const numPayments = 30 * 12;
  const monthlyPayment = (price * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                         (Math.pow(1 + monthlyRate, numPayments) - 1);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(monthlyPayment);
}

function formatPricePerSqFt(price: number | null, sqft: number | null) {
  if (!price || !sqft) return null;
  return `$${Math.round(price / sqft).toLocaleString()}`;
}

interface PublicPropertyDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  property: PublicSessionProperty | null;
  sessionDate?: string | null;
  onOpenDocument?: (doc: PublicPropertyDocument) => void;
  onDownloadDocument?: (doc: PublicPropertyDocument) => void;
  agentInfo?: AgentInfo;
}

export default function PublicPropertyDetailDialog({
  open,
  onOpenChange,
  property,
  onOpenDocument,
  onDownloadDocument,
  agentInfo,
}: PublicPropertyDetailDialogProps) {
  const [docsDrawerOpen, setDocsDrawerOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);

  if (!property) return null;

  const fullAddress = [
    property.address,
    property.city,
    property.state,
    property.zip_code,
  ]
    .filter(Boolean)
    .join(', ');

  const quickStats = [
    property.beds ? `${property.beds} Bd` : null,
    property.baths ? `${property.baths} Ba` : null,
    property.sqft ? `${property.sqft.toLocaleString()} Sq Ft` : null,
  ].filter(Boolean).join('  •  ');

  // Collect all available images
  const images = [
    property.photo_url,
    ...(property.photo_urls || []),
  ].filter(Boolean) as string[];

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="fixed inset-0 z-50 max-w-3xl p-0 overflow-hidden h-[100dvh] w-full sm:h-auto sm:max-h-[90vh] sm:w-auto gap-0 rounded-none sm:rounded-lg sm:inset-auto sm:left-[50%] sm:top-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%] data-[state=open]:slide-in-from-bottom-0 sm:data-[state=open]:slide-in-from-bottom-2">
          <DialogHeader className="sr-only">
            <DialogTitle>Property details</DialogTitle>
          </DialogHeader>

          {/* Close button (notch-safe) */}
          <div className="absolute top-0 right-0 z-50 safe-area-top">
            <button
              onClick={() => onOpenChange(false)}
              className="m-4 touch-target w-11 h-11 rounded-full bg-background/80 backdrop-blur-md border border-border flex items-center justify-center hover:bg-background transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-foreground" />
            </button>
          </div>

          {/* Scrollable content */}
          <div className="overflow-y-auto h-full sm:max-h-[90vh] overscroll-contain touch-pan-y safe-area-bottom [-webkit-overflow-scrolling:touch]">
            {/* Hero Photo - Clickable to open gallery */}
            <button
              type="button"
              className="relative w-full h-48 sm:h-64 bg-muted cursor-pointer group text-left"
              onClick={() => images.length > 0 && setGalleryOpen(true)}
              aria-label={images.length > 0 ? 'Open photo gallery' : 'No photos available'}
            >
              {property.photo_url ? (
                <>
                  <img
                    src={property.photo_url}
                    alt={property.address}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    loading="lazy"
                  />
                  {/* Zoom overlay on hover */}
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="bg-white/90 rounded-full p-3">
                      <ZoomIn className="w-6 h-6 text-foreground" />
                    </div>
                  </div>
                  {/* Photo count badge */}
                  {images.length > 1 && (
                    <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs font-medium px-2 py-1 rounded">
                      1/{images.length}
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  No photo
                </div>
              )}
            </button>

            {/* Content */}
            <div className="px-4 sm:px-6 py-6 space-y-5">
              {/* Price Header */}
              <div>
                {property.price && (
                  <h1 className="font-display text-3xl sm:text-4xl font-bold text-primary tracking-tight italic">
                    {formatPrice(property.price)}
                  </h1>
                )}
                {quickStats && (
                  <p className="text-sm text-foreground mt-1 font-medium tracking-wide">
                    {quickStats}
                  </p>
                )}
                <div className="flex items-center gap-1.5 mt-2 text-muted-foreground">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm">{fullAddress}</span>
                </div>
                {property.price && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Est. <span className="text-foreground font-medium">{formatMonthlyPayment(property.price)}/mo</span>
                  </p>
                )}
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-4 gap-2 sm:gap-3">
                <StatCard icon={<Bed className="w-5 h-5" />} value={property.beds} label="Beds" />
                <StatCard icon={<Bath className="w-5 h-5" />} value={property.baths} label="Baths" />
                <StatCard 
                  icon={<Square className="w-5 h-5" />} 
                  value={property.sqft ? property.sqft.toLocaleString() : null} 
                  label="Sq Ft" 
                />
                <StatCard 
                  icon={<CalendarDays className="w-5 h-5" />} 
                  value={property.year_built} 
                  label="Built" 
                />
              </div>

              {/* Property Details Section */}
              {(property.year_built || property.lot_size || property.sqft || property.garage) && (
                <ContentCard>
                  <h2 className="font-display text-xl sm:text-2xl font-semibold text-foreground mb-4">
                    Property Details
                  </h2>
                  <div className="grid grid-cols-2 gap-y-3 gap-x-6">
                    {property.year_built && (
                      <DetailRow 
                        icon={<CalendarDays className="w-4 h-4" />} 
                        label="Year Built" 
                        value={String(property.year_built)} 
                      />
                    )}
                    {property.lot_size && (
                      <DetailRow 
                        icon={<Tag className="w-4 h-4" />} 
                        label="Lot" 
                        value={property.lot_size} 
                      />
                    )}
                    {property.price && property.sqft && (
                      <DetailRow 
                        icon={<DollarSign className="w-4 h-4" />} 
                        label="Price/Sq.Ft." 
                        value={formatPricePerSqFt(property.price, property.sqft) || ''} 
                      />
                    )}
                    {property.garage && (
                      <DetailRow 
                        icon={<Car className="w-4 h-4" />} 
                        label="Parking" 
                        value={property.garage} 
                      />
                    )}
                  </div>
                </ContentCard>
              )}

              {/* Agent's Note */}
              {property.agent_notes && (
                <ContentCard>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    {agentInfo?.name ? `${agentInfo.name}'s note` : "Agent's note"}
                  </p>
                  <p className="text-sm sm:text-base text-foreground leading-relaxed">
                    {property.agent_notes}
                  </p>
                </ContentCard>
              )}

              {/* Property Documents */}
              {property.documents && property.documents.length > 0 && (
                <ContentCard>
                  <h2 className="font-display text-xl sm:text-2xl font-semibold text-foreground mb-4">
                    Property Documents
                  </h2>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 rounded-full border-border"
                    onClick={() => setDocsDrawerOpen(true)}
                  >
                    <FileText className="h-4 w-4" />
                    DOCS ({property.documents.length})
                  </Button>
                </ContentCard>
              )}

              {/* Summary */}
              {property.summary && (
                <ContentCard>
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <h2 className="font-display text-xl sm:text-2xl font-semibold text-foreground italic">
                      Summary
                    </h2>
                  </div>
                  <div className="text-sm sm:text-base text-muted-foreground leading-relaxed space-y-1">
                    {property.summary.split('\n').map((line, idx) => (
                      <p key={idx}>{line.startsWith('•') || line.startsWith('-') ? line : `• ${line}`}</p>
                    ))}
                  </div>
                </ContentCard>
              )}

              {/* Features */}
              {property.features && property.features.length > 0 && (
                <ContentCard>
                  <h2 className="font-display text-xl sm:text-2xl font-semibold text-foreground mb-3">
                    Features
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {property.features.map((feature, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-3 py-1.5 rounded-full text-sm bg-secondary text-secondary-foreground"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </ContentCard>
              )}

              {/* About This Home */}
              {property.description && (
                <ContentCard>
                  <h2 className="font-display text-xl sm:text-2xl font-semibold text-foreground mb-3">
                    About This Home
                  </h2>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed whitespace-pre-line">
                    {property.description}
                  </p>
                </ContentCard>
              )}

              {/* Mortgage Calculator */}
              {property.price && (
                <MortgageCalculator propertyPrice={property.price} />
              )}

              {/* Agent Card */}
              {agentInfo?.name && (
                <ContentCard className="bg-muted/30">
                  <div className="flex items-center gap-4">
                    {agentInfo.avatarUrl ? (
                      <img 
                        src={agentInfo.avatarUrl} 
                        alt={agentInfo.name}
                        className="w-14 h-14 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xl font-semibold text-primary">
                          {agentInfo.name.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-foreground">{agentInfo.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {agentInfo.title || 'Your trusted real estate advisor'}
                      </p>
                    </div>
                  </div>
                  {agentInfo.message && (
                    <p className="text-sm text-muted-foreground mt-3">
                      {agentInfo.message}
                    </p>
                  )}
                </ContentCard>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <PropertyDocumentsDrawer
        open={docsDrawerOpen}
        onOpenChange={setDocsDrawerOpen}
        propertyAddress={fullAddress}
        documents={property.documents || []}
        onOpen={(doc) => onOpenDocument?.({ ...doc, file_url: '' })}
        onDownload={(doc) => onDownloadDocument?.({ ...doc, file_url: '' })}
      />

      <ImageGallery
        images={images}
        open={galleryOpen}
        onOpenChange={setGalleryOpen}
        alt={fullAddress}
      />
    </>
  );
}

// ============= Sub-components =============

interface StatCardProps {
  icon: React.ReactNode;
  value: string | number | null | undefined;
  label: string;
}

function StatCard({ icon, value, label }: StatCardProps) {
  return (
    <div className="border border-border rounded-lg p-3 sm:p-4 flex flex-col items-center justify-center text-center bg-background">
      <div className="text-muted-foreground mb-1">
        {icon}
      </div>
      <p className="font-display text-lg sm:text-xl font-bold text-foreground">
        {value ?? '—'}
      </p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

interface DetailRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

function DetailRow({ icon, label, value }: DetailRowProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground">{icon}</span>
      <span className="text-sm text-muted-foreground">{label}:</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}

interface ContentCardProps {
  children: React.ReactNode;
  className?: string;
}

function ContentCard({ children, className = '' }: ContentCardProps) {
  return (
    <div className={`border border-border rounded-xl p-4 sm:p-5 bg-background ${className}`}>
      {children}
    </div>
  );
}
