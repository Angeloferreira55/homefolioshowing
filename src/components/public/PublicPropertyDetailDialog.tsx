import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar, ExternalLink, FileText, MapPin, X, MessageSquare, Sparkles, Home, Building, Thermometer, Wind, Car, DollarSign, Ruler, CalendarDays } from 'lucide-react';
import { format } from 'date-fns';
import PropertyDocumentsDrawer from './PropertyDocumentsDrawer';

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

function formatPrice(price: number | null) {
  if (!price) return null;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(price);
}

interface PublicPropertyDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  property: PublicSessionProperty | null;
  sessionDate?: string | null;
  onOpenDocument?: (doc: PublicPropertyDocument) => void;
  onDownloadDocument?: (doc: PublicPropertyDocument) => void;
}

export default function PublicPropertyDetailDialog({
  open,
  onOpenChange,
  property,
  sessionDate,
  onOpenDocument,
  onDownloadDocument,
}: PublicPropertyDetailDialogProps) {
  const [docsDrawerOpen, setDocsDrawerOpen] = useState(false);

  if (!property) return null;

  const fullAddress = [
    property.address,
    property.city,
    property.state,
    property.zip_code,
  ]
    .filter(Boolean)
    .join(property.address && (property.city || property.state || property.zip_code) ? ', ' : '');

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>Property details</DialogTitle>
          </DialogHeader>

          <div className="grid md:grid-cols-2">
            {/* Photo */}
            <div className="relative aspect-square md:aspect-auto bg-muted">
              {property.photo_url ? (
                <img
                  src={property.photo_url}
                  alt={property.address}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  No photo
                </div>
              )}
            </div>

            {/* Details */}
            <div className="p-6 max-h-[80vh] overflow-y-auto relative">
              <button
                onClick={() => onOpenChange(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Price */}
              {property.price && (
                <div className="mb-3">
                  <span className="text-3xl font-display font-bold text-foreground">
                    {formatPrice(property.price)}
                  </span>
                </div>
              )}

              {/* Address */}
              <div className="flex items-start gap-2 mb-4">
                <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-display text-lg font-semibold text-foreground">{property.address}</p>
                  <p className="text-muted-foreground">{fullAddress}</p>
                </div>
              </div>

              {/* Session date */}
              {sessionDate && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(sessionDate), 'EEEE, MMMM d, yyyy')}
                </div>
              )}

              {/* Stats */}
              {(property.beds || property.baths || property.sqft) && (
                <div className="grid grid-cols-3 gap-3 p-4 bg-secondary rounded-xl mb-6">
                  <div className="text-center">
                    <p className="font-semibold text-foreground">{property.beds ?? '—'}</p>
                    <p className="text-xs text-muted-foreground">Beds</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-foreground">{property.baths ?? '—'}</p>
                    <p className="text-xs text-muted-foreground">Baths</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-foreground">
                      {property.sqft ? property.sqft.toLocaleString() : '—'}
                    </p>
                    <p className="text-xs text-muted-foreground">Sq Ft</p>
                  </div>
                </div>
              )}

              {/* Property Details Grid */}
              {(property.year_built || property.lot_size || property.property_type || property.hoa_fee || property.garage || property.heating || property.cooling) && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Building className="w-4 h-4 text-primary" />
                    Property Details
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {property.property_type && (
                      <div className="bg-muted/50 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground">Type</p>
                        <p className="text-sm font-medium text-foreground">{property.property_type}</p>
                      </div>
                    )}
                    {property.year_built && (
                      <div className="bg-muted/50 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <CalendarDays className="w-3 h-3" /> Year Built
                        </p>
                        <p className="text-sm font-medium text-foreground">{property.year_built}</p>
                      </div>
                    )}
                    {property.lot_size && (
                      <div className="bg-muted/50 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Ruler className="w-3 h-3" /> Lot Size
                        </p>
                        <p className="text-sm font-medium text-foreground">{property.lot_size}</p>
                      </div>
                    )}
                    {property.garage && (
                      <div className="bg-muted/50 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Car className="w-3 h-3" /> Garage
                        </p>
                        <p className="text-sm font-medium text-foreground">{property.garage}</p>
                      </div>
                    )}
                    {property.heating && (
                      <div className="bg-muted/50 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Thermometer className="w-3 h-3" /> Heating
                        </p>
                        <p className="text-sm font-medium text-foreground">{property.heating}</p>
                      </div>
                    )}
                    {property.cooling && (
                      <div className="bg-muted/50 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Wind className="w-3 h-3" /> Cooling
                        </p>
                        <p className="text-sm font-medium text-foreground">{property.cooling}</p>
                      </div>
                    )}
                    {property.hoa_fee && (
                      <div className="bg-muted/50 rounded-lg p-3 col-span-2">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <DollarSign className="w-3 h-3" /> HOA Fee
                        </p>
                        <p className="text-sm font-medium text-foreground">${property.hoa_fee.toLocaleString()}/month</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Features */}
              {property.features && property.features.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-foreground mb-3">Features & Amenities</h3>
                  <div className="flex flex-wrap gap-2">
                    {property.features.map((feature, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-secondary text-secondary-foreground text-xs rounded-full"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Summary */}
              {property.summary && (
                <div className="mb-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-semibold text-foreground">Summary</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {property.summary}
                  </p>
                </div>
              )}

              {/* About This Home */}
              {property.description && (
                <div className="mb-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Home className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-semibold text-foreground">About This Home</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                    {property.description}
                  </p>
                </div>
              )}

              {/* Agent's Notes */}
              {property.agent_notes && (
                <div className="mb-5 p-4 bg-primary/5 border border-primary/10 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-semibold text-foreground">Agent's Notes</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                    {property.agent_notes}
                  </p>
                </div>
              )}

              {/* Documents */}
              {property.documents && property.documents.length > 0 && (
                <div className="mb-6">
                  <Button
                    variant="outline"
                    className="w-full justify-between"
                    onClick={() => setDocsDrawerOpen(true)}
                  >
                    <span className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Property Documents
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {property.documents.length}
                    </span>
                  </Button>
                </div>
              )}

              {/* Fallback action */}
              {property.photo_url && (
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => window.open(property.photo_url as string, '_blank')}
                >
                  <ExternalLink className="w-4 h-4" />
                  Open photo
                </Button>
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
    </>
  );
}
