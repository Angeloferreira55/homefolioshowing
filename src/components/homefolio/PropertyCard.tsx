import { Property } from '@/types/homefolio';
import { formatPrice } from '@/lib/mockData';
import { Bed, Bath, Square, MoreHorizontal, Calendar, FileText, Archive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface PropertyCardProps {
  property: Property;
  onView: (property: Property) => void;
  onArchive?: (property: Property) => void;
  isClientView?: boolean;
}

const PropertyCard = ({ property, onView, onArchive, isClientView = false }: PropertyCardProps) => {
  return (
    <div
      className="group bg-card rounded-2xl overflow-hidden card-elevated cursor-pointer"
      onClick={() => onView(property)}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={property.photos[0]}
          alt={property.address}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Menu (agent view only) */}
        {!isClientView && (
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="secondary" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onView(property); }}>
                  <FileText className="w-4 h-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Calendar className="w-4 h-4 mr-2" />
                  Add Showing Note
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => { e.stopPropagation(); onArchive?.(property); }}
                  className="text-destructive"
                >
                  <Archive className="w-4 h-4 mr-2" />
                  Archive Property
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* Photo count */}
        {property.photos.length > 1 && (
          <div className="absolute bottom-3 right-3">
            <span className="px-2 py-1 rounded-md bg-black/70 text-white text-xs font-medium">
              1/{property.photos.length}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-display font-semibold text-foreground line-clamp-1 flex-1">
            {property.address}
          </h3>
          <span className="font-display text-lg font-bold text-primary shrink-0">
            {formatPrice(property.price)}
          </span>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          {property.city}, {property.state} {property.zipCode}
        </p>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Bed className="w-4 h-4" />
            <span>{property.beds} beds</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Bath className="w-4 h-4" />
            <span>{property.baths} baths</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Square className="w-4 h-4" />
            <span>{property.sqft.toLocaleString()} sqft</span>
          </div>
        </div>

        {/* Indicators */}
        {!isClientView && (property.documents.length > 0 || property.showingNotes.length > 0) && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
            {property.documents.length > 0 && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <FileText className="w-3 h-3" />
                {property.documents.length} docs
              </span>
            )}
            {property.showingNotes.length > 0 && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="w-3 h-3" />
                {property.showingNotes.length} notes
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertyCard;
