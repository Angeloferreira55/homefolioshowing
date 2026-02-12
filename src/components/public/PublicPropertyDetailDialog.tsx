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

          {/* Scrollable content - Photo on top, single column below */}
          <div className="flex-1 overflow-y-auto overscroll-contain touch-pan-y safe-area-bottom [-webkit-overflow-scrolling:touch]">
            {/* Hero Photo - Full width at top */}
            <button
              type="button"
              className="relative w-full h-48 bg-muted cursor-pointer group text-left"
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

            {/* Content below photo */}
            <div className="p-3 space-y-2.5">
              {/* Price & Address Header */}
              <div>
                {property.price && (
                  <h1 className="font-display text-2xl font-bold text-primary tracking-tight italic">
                    {formatPrice(property.price)}
                  </h1>
                )}
                <div className="flex items-start gap-1 mt-1">
                  <MapPin className="w-3 h-3 flex-shrink-0 mt-0.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{fullAddress}</span>
                </div>
                {quickStats && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {quickStats}
                  </p>
                )}
                {property.price && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Est. <span className="text-foreground font-medium">{formatMonthlyPayment(property.price)}/mo</span>
                  </p>
                )}
              </div>

              {/* Agent's Note */}
              {property.agent_notes && (
                <div className="text-xs">
                  <p className="font-semibold text-muted-foreground uppercase mb-1">
                    {agentInfo?.name ? `${agentInfo.name}'s note` : "Agent's note"}
                  </p>
                  <p className="text-foreground leading-relaxed">{property.agent_notes}</p>
                </div>
              )}

              {/* Summary */}
              {property.summary && (
                <div className="text-xs">
                  <div className="flex items-center gap-1 mb-1">
                    <Sparkles className="w-3 h-3 text-primary" />
                    <h3 className="font-semibold text-foreground italic">Summary</h3>
                  </div>
                  <div className="text-muted-foreground leading-relaxed space-y-0.5">
                    {property.summary.split('\n').map((line, idx) => (
                      <p key={idx}>{line.startsWith('•') || line.startsWith('-') ? line : `• ${line}`}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* About This Home */}
              {property.description && (
                <div className="text-xs">
                  <h3 className="font-semibold mb-1">About This Home</h3>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                    {property.description}
                  </p>
                </div>
              )}

              {/* Property Details */}
              <div className="text-xs">
                <h3 className="font-semibold mb-2">Property Details</h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  {property.beds && (
                    <div className="flex items-center gap-2">
                      <Bed className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1">
                        <span className="text-muted-foreground">Bedrooms:</span>
                        <span className="ml-1 font-medium text-foreground">{property.beds}</span>
                      </div>
                    </div>
                  )}
                  {property.baths && (
                    <div className="flex items-center gap-2">
                      <Bath className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1">
                        <span className="text-muted-foreground">Bathrooms:</span>
                        <span className="ml-1 font-medium text-foreground">{property.baths}</span>
                      </div>
                    </div>
                  )}
                  {property.sqft && (
                    <div className="flex items-center gap-2">
                      <Square className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1">
                        <span className="text-muted-foreground">Square Feet:</span>
                        <span className="ml-1 font-medium text-foreground">{property.sqft.toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                  {property.year_built && (
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1">
                        <span className="text-muted-foreground">Year Built:</span>
                        <span className="ml-1 font-medium text-foreground">{property.year_built}</span>
                      </div>
                    </div>
                  )}
                  {property.lot_size && (
                    <div className="flex items-center gap-2">
                      <Tag className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1">
                        <span className="text-muted-foreground">Lot Size:</span>
                        <span className="ml-1 font-medium text-foreground">{property.lot_size}</span>
                      </div>
                    </div>
                  )}
                  {property.price && property.sqft && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1">
                        <span className="text-muted-foreground">Price/Sq Ft:</span>
                        <span className="ml-1 font-medium text-foreground">{formatPricePerSqFt(property.price, property.sqft)}</span>
                      </div>
                    </div>
                  )}
                  {property.garage && (
                    <div className="flex items-center gap-2">
                      <Car className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1">
                        <span className="text-muted-foreground">Parking:</span>
                        <span className="ml-1 font-medium text-foreground">{property.garage}</span>
                      </div>
                    </div>
                  )}
                  {property.property_type && (
                    <div className="flex items-center gap-2">
                      <Square className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1">
                        <span className="text-muted-foreground">Property Type:</span>
                        <span className="ml-1 font-medium text-foreground">{property.property_type}</span>
                      </div>
                    </div>
                  )}
                  {property.hoa_fee && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1">
                        <span className="text-muted-foreground">HOA Fee:</span>
                        <span className="ml-1 font-medium text-foreground">${property.hoa_fee}/mo</span>
                      </div>
                    </div>
                  )}
                  {property.heating && (
                    <div className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0">🔥</span>
                      <div className="flex-1">
                        <span className="text-muted-foreground">Heating:</span>
                        <span className="ml-1 font-medium text-foreground">{property.heating}</span>
                      </div>
                    </div>
                  )}
                  {property.cooling && (
                    <div className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0">❄️</span>
                      <div className="flex-1">
                        <span className="text-muted-foreground">Cooling:</span>
                        <span className="ml-1 font-medium text-foreground">{property.cooling}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Features */}
              {property.features && property.features.length > 0 && (
                <div className="text-xs">
                  <h3 className="font-semibold mb-1.5">Features</h3>
                  <div className="flex flex-wrap gap-1">
                    {property.features.map((feature, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-secondary text-secondary-foreground"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Mortgage Calculator */}
              {property.price && (
                <MortgageCalculator propertyPrice={property.price} />
              )}

              {/* Property Documents */}
              {property.documents && property.documents.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 w-full text-xs h-7"
                  onClick={() => setDocsDrawerOpen(true)}
                >
                  <FileText className="h-3 w-3" />
                  View Documents ({property.documents.length})
                </Button>
              )}

              {/* Agent Info */}
              {agentInfo?.name && (
                <div className="text-xs pt-2 border-t">
                  <p className="font-semibold text-foreground">{agentInfo.name}</p>
                  <p className="text-muted-foreground">{agentInfo.title || 'Your trusted real estate advisor'}</p>
                  {agentInfo.message && (
                    <p className="text-muted-foreground mt-1">{agentInfo.message}</p>
                  )}
                </div>
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
