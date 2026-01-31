import { useState } from 'react';
import { Property } from '@/types/homefolio';
import { formatPrice, formatDate } from '@/lib/mockData';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Bed,
  Bath,
  Square,
  MapPin,
  ChevronLeft,
  ChevronRight,
  FileText,
  Calendar,
  X,
} from 'lucide-react';

interface PropertyDetailProps {
  property: Property | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isClientView?: boolean;
}

const PropertyDetail = ({ property, open, onOpenChange, isClientView = false }: PropertyDetailProps) => {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  if (!property) return null;

  const nextPhoto = () => {
    setCurrentPhotoIndex((prev) =>
      prev === property.photos.length - 1 ? 0 : prev + 1
    );
  };

  const prevPhoto = () => {
    setCurrentPhotoIndex((prev) =>
      prev === 0 ? property.photos.length - 1 : prev - 1
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden">
        <div className="grid md:grid-cols-2">
          {/* Photo Gallery */}
          <div className="relative aspect-square md:aspect-auto bg-muted">
            <img
              src={property.photos[currentPhotoIndex]}
              alt={`${property.address} - Photo ${currentPhotoIndex + 1}`}
              className="w-full h-full object-cover"
            />
            
            {property.photos.length > 1 && (
              <>
                <button
                  onClick={prevPhoto}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-card/90 backdrop-blur-sm flex items-center justify-center hover:bg-card transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={nextPhoto}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-card/90 backdrop-blur-sm flex items-center justify-center hover:bg-card transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                  {property.photos.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentPhotoIndex(index)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        index === currentPhotoIndex
                          ? 'bg-white scale-125'
                          : 'bg-white/50 hover:bg-white/70'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Details */}
          <div className="p-6 max-h-[80vh] overflow-y-auto">
            {/* Close button */}
            <button
              onClick={() => onOpenChange(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Price */}
            <div className="mb-4">
              <span className="text-3xl font-display font-bold text-foreground">
                {formatPrice(property.price)}
              </span>
            </div>

            {/* Address */}
            <div className="flex items-start gap-2 mb-6">
              <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-semibold text-foreground">{property.address}</p>
                <p className="text-muted-foreground">
                  {property.city}, {property.state} {property.zipCode}
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-secondary rounded-xl mb-6">
              <div className="text-center">
                <Bed className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                <p className="font-semibold text-foreground">{property.beds}</p>
                <p className="text-xs text-muted-foreground">Beds</p>
              </div>
              <div className="text-center">
                <Bath className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                <p className="font-semibold text-foreground">{property.baths}</p>
                <p className="text-xs text-muted-foreground">Baths</p>
              </div>
              <div className="text-center">
                <Square className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                <p className="font-semibold text-foreground">{property.sqft.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Sq Ft</p>
              </div>
            </div>

            {/* Documents */}
            {property.documents.length > 0 && (
              <div className="mb-6">
                <h3 className="font-display font-semibold text-foreground mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Documents
                </h3>
                <div className="space-y-2">
                  {property.documents.map((doc) => (
                    <a
                      key={doc.id}
                      href={doc.url}
                      className="flex items-center justify-between p-3 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
                    >
                      <span className="text-sm font-medium text-foreground">{doc.name}</span>
                      <span className="text-xs text-muted-foreground px-2 py-1 rounded bg-muted">
                        {doc.type.toUpperCase()}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Showing Notes (agent view only) */}
            {!isClientView && property.showingNotes.length > 0 && (
              <div>
                <h3 className="font-display font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Showing Notes
                </h3>
                <div className="space-y-3">
                  {property.showingNotes.map((note) => (
                    <div key={note.id} className="p-3 rounded-lg bg-secondary">
                      <p className="text-xs text-muted-foreground mb-1">
                        {formatDate(note.date)}
                      </p>
                      <p className="text-sm text-foreground">{note.notes}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PropertyDetail;
