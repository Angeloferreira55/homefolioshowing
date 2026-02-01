import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar, ExternalLink, FileText, MapPin, X } from 'lucide-react';
import { format } from 'date-fns';

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
}

function formatPrice(price: number | null) {
  if (!price) return null;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(price);
}

function getDocTypeLabel(type: string | null) {
  const labels: Record<string, string> = {
    disclosure: 'Disclosure',
    inspection: 'Inspection',
    floor_plan: 'Floor Plan',
    hoa: 'HOA',
    survey: 'Survey',
    title: 'Title',
    other: 'Document',
  };
  return labels[type || 'other'] || 'Document';
}

interface PublicPropertyDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  property: PublicSessionProperty | null;
  sessionDate?: string | null;
  onOpenDocument?: (doc: PublicPropertyDocument) => void;
}

export default function PublicPropertyDetailDialog({
  open,
  onOpenChange,
  property,
  sessionDate,
  onOpenDocument,
}: PublicPropertyDetailDialogProps) {
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

            {/* Documents */}
            {property.documents && property.documents.length > 0 && (
              <div className="mb-6">
                <h3 className="font-display font-semibold text-foreground mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Documents
                </h3>
                <div className="space-y-2">
                  {property.documents.map((doc) => (
                    <button
                      key={doc.id}
                      onClick={() => onOpenDocument?.(doc)}
                      className="w-full text-left flex items-center justify-between p-3 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
                    >
                      <span className="text-sm font-medium text-foreground">{doc.name}</span>
                      <span className="text-xs text-muted-foreground px-2 py-1 rounded bg-muted">
                        {getDocTypeLabel(doc.doc_type)}
                      </span>
                    </button>
                  ))}
                </div>
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
  );
}
