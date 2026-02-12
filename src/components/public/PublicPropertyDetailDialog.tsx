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
        <DialogContent className="w-[95vw] max-w-3xl p-0 gap-0 max-h-[90vh] sm:rounded-lg flex flex-col overflow-hidden">
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

          {/* Scrollable content - Compact single-page layout */}
          <div className="flex-1 overflow-y-auto overscroll-contain touch-pan-y safe-area-bottom [-webkit-overflow-scrolling:touch]">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
              {/* LEFT COLUMN - Photo and Key Details */}
              <div className="space-y-3">
                {/* Hero Photo - Clickable to open gallery */}
                <button
                  type="button"
                  className="relative w-full h-64 bg-muted cursor-pointer group text-left rounded-lg overflow-hidden"
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
                        <div className="bg-white/90 rounded-full p-2">
                          <ZoomIn className="w-5 h-5 text-foreground" />
                        </div>
                      </div>
                      {/* Photo count badge */}
                      {images.length > 1 && (
                        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs font-medium px-2 py-1 rounded">
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

                {/* Stats Cards */}
                <div className="grid grid-cols-4 gap-2">
                  <StatCard icon={<Bed className="w-4 h-4" />} value={property.beds} label="Beds" />
                  <StatCard icon={<Bath className="w-4 h-4" />} value={property.baths} label="Baths" />
                  <StatCard
                    icon={<Square className="w-4 h-4" />}
                    value={property.sqft ? property.sqft.toLocaleString() : null}
                    label="Sq Ft"
                  />
                  <StatCard
                    icon={<Tag className="w-4 h-4" />}
                    value={property.lot_size || '—'}
                    label="Lot"
                  />
                </div>

                {/* Property Details */}
                {(property.year_built || property.garage) && (
                  <div className="border border-border rounded-lg p-3 bg-background">
                    <h3 className="text-sm font-semibold mb-2">Details</h3>
                    <div className="space-y-1.5 text-xs">
                      {property.year_built && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Year Built:</span>
                          <span className="font-medium">{property.year_built}</span>
                        </div>
                      )}
                      {property.price && property.sqft && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Price/Sq.Ft:</span>
                          <span className="font-medium">{formatPricePerSqFt(property.price, property.sqft)}</span>
                        </div>
                      )}
                      {property.garage && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Parking:</span>
                          <span className="font-medium">{property.garage}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Mortgage Calculator */}
                {property.price && (
                  <MortgageCalculator propertyPrice={property.price} />
                )}
              </div>

              {/* RIGHT COLUMN - Price, Description, and Content */}
              <div className="space-y-3">
                {/* Price Header - Compact */}
                <div className="border border-border rounded-lg p-3 bg-background">
                  {property.price && (
                    <h1 className="font-display text-2xl font-bold text-primary tracking-tight italic">
                      {formatPrice(property.price)}
                    </h1>
                  )}
                  <div className="flex items-start gap-1.5 mt-1 text-muted-foreground">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    <span className="text-xs leading-tight">{fullAddress}</span>
                  </div>
                  {property.price && (
                    <p className="text-xs text-muted-foreground mt-1.5">
                      Est. <span className="text-foreground font-medium">{formatMonthlyPayment(property.price)}/mo</span>
                    </p>
                  )}
                </div>

                {/* Agent's Note - Compact */}
                {property.agent_notes && (
                  <div className="border border-border rounded-lg p-3 bg-background">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                      {agentInfo?.name ? `${agentInfo.name}'s note` : "Agent's note"}
                    </p>
                    <p className="text-xs text-foreground leading-relaxed">
                      {property.agent_notes}
                    </p>
                  </div>
                )}

                {/* Summary - Compact */}
                {property.summary && (
                  <div className="border border-border rounded-lg p-3 bg-background">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                      <h3 className="text-sm font-semibold text-foreground italic">Summary</h3>
                    </div>
                    <div className="text-xs text-muted-foreground leading-relaxed space-y-0.5">
                      {property.summary.split('\n').map((line, idx) => (
                        <p key={idx}>{line.startsWith('•') || line.startsWith('-') ? line : `• ${line}`}</p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Features - Compact */}
                {property.features && property.features.length > 0 && (
                  <div className="border border-border rounded-lg p-3 bg-background">
                    <h3 className="text-sm font-semibold mb-2">Features</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {property.features.map((feature, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-secondary text-secondary-foreground"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* About This Home - Compact */}
                {property.description && (
                  <div className="border border-border rounded-lg p-3 bg-background">
                    <h3 className="text-sm font-semibold mb-1.5">About This Home</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                      {property.description}
                    </p>
                  </div>
                )}

                {/* Property Documents - Compact button only */}
                {property.documents && property.documents.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 w-full text-xs h-8"
                    onClick={() => setDocsDrawerOpen(true)}
                  >
                    <FileText className="h-3.5 w-3.5" />
                    View Documents ({property.documents.length})
                  </Button>
                )}

                {/* Agent Card - Compact */}
                {agentInfo?.name && (
                  <div className="border border-border rounded-lg p-3 bg-muted/20">
                    <p className="text-sm font-semibold text-foreground">{agentInfo.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {agentInfo.title || 'Your trusted real estate advisor'}
                    </p>
                    {agentInfo.message && (
                      <p className="text-xs text-muted-foreground mt-1.5">
                        {agentInfo.message}
                      </p>
                    )}
                  </div>
                )}
              </div>
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
    <div className="border border-border rounded-lg p-2 flex flex-col items-center justify-center text-center bg-background">
      <div className="text-muted-foreground mb-0.5">
        {icon}
      </div>
      <p className="font-display text-base font-bold text-foreground">
        {value ?? '—'}
      </p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
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
