import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Home, MapPin, Bed, Bath, Square, DollarSign, Calendar, Check, X, Scale } from 'lucide-react';

interface PropertyForComparison {
  id: string;
  address: string;
  city?: string | null;
  state?: string | null;
  price?: number | null;
  beds?: number | null;
  baths?: number | null;
  sqft?: number | null;
  photo_url?: string | null;
  year_built?: number | null;
  lot_size?: string | null;
  property_type?: string | null;
  hoa_fee?: number | null;
  garage?: string | null;
  heating?: string | null;
  cooling?: string | null;
}

interface PropertyRating {
  rating: number;
}

interface PropertyCompareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  properties: PropertyForComparison[];
  ratings: Record<string, PropertyRating>;
}

const PropertyCompareDialog = ({
  open,
  onOpenChange,
  properties,
  ratings,
}: PropertyCompareDialogProps) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);

  const toggleProperty = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else if (selectedIds.length < 3) {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const selectedProperties = properties.filter(p => selectedIds.includes(p.id));

  const formatPrice = (price: number | null | undefined) => {
    if (!price) return '—';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatPricePerSqft = (price: number | null | undefined, sqft: number | null | undefined) => {
    if (!price || !sqft) return '—';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(Math.round(price / sqft));
  };

  const getHighestRatedId = () => {
    let highestRating = -1;
    let highestId = '';
    selectedProperties.forEach(p => {
      const rating = ratings[p.id]?.rating || 0;
      if (rating > highestRating) {
        highestRating = rating;
        highestId = p.id;
      }
    });
    return highestId;
  };

  const getLowestPriceId = () => {
    let lowestPrice = Infinity;
    let lowestId = '';
    selectedProperties.forEach(p => {
      if (p.price && p.price < lowestPrice) {
        lowestPrice = p.price;
        lowestId = p.id;
      }
    });
    return lowestId;
  };

  const getLargestSqftId = () => {
    let largestSqft = 0;
    let largestId = '';
    selectedProperties.forEach(p => {
      if (p.sqft && p.sqft > largestSqft) {
        largestSqft = p.sqft;
        largestId = p.id;
      }
    });
    return largestId;
  };

  const highestRatedId = getHighestRatedId();
  const lowestPriceId = getLowestPriceId();
  const largestSqftId = getLargestSqftId();

  const resetSelection = () => {
    setSelectedIds([]);
    setShowComparison(false);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      onOpenChange(isOpen);
      if (!isOpen) resetSelection();
    }}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <Scale className="w-5 h-5" />
            Compare Properties
          </DialogTitle>
        </DialogHeader>

        {!showComparison ? (
          // Selection Mode
          <div className="flex-1 overflow-hidden flex flex-col">
            <p className="text-sm text-muted-foreground mb-4">
              Select 2-3 properties to compare ({selectedIds.length}/3 selected)
            </p>
            
            <ScrollArea className="flex-1">
              <div className="space-y-2 pr-4">
                {properties.map((property) => (
                  <div
                    key={property.id}
                    className={`flex items-center gap-4 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedIds.includes(property.id)
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => toggleProperty(property.id)}
                  >
                    <Checkbox
                      checked={selectedIds.includes(property.id)}
                      disabled={!selectedIds.includes(property.id) && selectedIds.length >= 3}
                    />
                    
                    <div className="w-16 h-16 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
                      {property.photo_url ? (
                        <img src={property.photo_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Home className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{property.address}</p>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        {property.beds && <span>{property.beds} bd</span>}
                        {property.baths && <span>{property.baths} ba</span>}
                        {property.sqft && <span>{property.sqft.toLocaleString()} sqft</span>}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-display font-semibold">{formatPrice(property.price)}</p>
                      {ratings[property.id] && (
                        <p className="text-sm text-muted-foreground">
                          Rating: {ratings[property.id].rating}/10
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="pt-4 border-t mt-4">
              <Button
                onClick={() => setShowComparison(true)}
                disabled={selectedIds.length < 2}
                className="w-full"
              >
                Compare {selectedIds.length} Properties
              </Button>
            </div>
          </div>
        ) : (
          // Comparison View
          <ScrollArea className="flex-1">
            <div className="pr-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowComparison(false)}
                className="mb-4"
              >
                ← Back to Selection
              </Button>

              {/* Property Headers */}
              <div className="grid gap-4" style={{ gridTemplateColumns: `150px repeat(${selectedProperties.length}, 1fr)` }}>
                <div></div>
                {selectedProperties.map((property) => (
                  <div key={property.id} className="text-center">
                    <div className="aspect-[4/3] rounded-lg bg-muted overflow-hidden mb-2">
                      {property.photo_url ? (
                        <img src={property.photo_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Home className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <p className="font-medium text-sm leading-tight">{property.address}</p>
                    {property.city && (
                      <p className="text-xs text-muted-foreground">{property.city}, {property.state}</p>
                    )}
                  </div>
                ))}

                {/* Comparison Rows */}
                <CompareRow
                  label="Price"
                  icon={<DollarSign className="w-4 h-4" />}
                  values={selectedProperties.map(p => formatPrice(p.price))}
                  highlightId={lowestPriceId}
                  propertyIds={selectedProperties.map(p => p.id)}
                  highlightLabel="Best Price"
                />

                <CompareRow
                  label="Your Rating"
                  icon={<span className="text-sm">⭐</span>}
                  values={selectedProperties.map(p => ratings[p.id] ? `${ratings[p.id].rating}/10` : '—')}
                  highlightId={highestRatedId}
                  propertyIds={selectedProperties.map(p => p.id)}
                  highlightLabel="Highest Rated"
                />

                <CompareRow
                  label="Beds"
                  icon={<Bed className="w-4 h-4" />}
                  values={selectedProperties.map(p => p.beds?.toString() || '—')}
                />

                <CompareRow
                  label="Baths"
                  icon={<Bath className="w-4 h-4" />}
                  values={selectedProperties.map(p => p.baths?.toString() || '—')}
                />

                <CompareRow
                  label="Sq Ft"
                  icon={<Square className="w-4 h-4" />}
                  values={selectedProperties.map(p => p.sqft?.toLocaleString() || '—')}
                  highlightId={largestSqftId}
                  propertyIds={selectedProperties.map(p => p.id)}
                  highlightLabel="Largest"
                />

                <CompareRow
                  label="$/Sq Ft"
                  icon={<DollarSign className="w-4 h-4" />}
                  values={selectedProperties.map(p => formatPricePerSqft(p.price, p.sqft))}
                />

                <CompareRow
                  label="Year Built"
                  icon={<Calendar className="w-4 h-4" />}
                  values={selectedProperties.map(p => p.year_built?.toString() || '—')}
                />

                <CompareRow
                  label="Property Type"
                  icon={<Home className="w-4 h-4" />}
                  values={selectedProperties.map(p => p.property_type || '—')}
                />

                <CompareRow
                  label="Lot Size"
                  icon={<MapPin className="w-4 h-4" />}
                  values={selectedProperties.map(p => p.lot_size || '—')}
                />

                <CompareRow
                  label="HOA Fee"
                  icon={<DollarSign className="w-4 h-4" />}
                  values={selectedProperties.map(p => p.hoa_fee ? `$${p.hoa_fee}/mo` : '—')}
                />

                <CompareRow
                  label="Garage"
                  icon={<Home className="w-4 h-4" />}
                  values={selectedProperties.map(p => p.garage || '—')}
                />

                <CompareRow
                  label="Heating"
                  icon={<Check className="w-4 h-4" />}
                  values={selectedProperties.map(p => p.heating || '—')}
                />

                <CompareRow
                  label="Cooling"
                  icon={<Check className="w-4 h-4" />}
                  values={selectedProperties.map(p => p.cooling || '—')}
                />
              </div>
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
};

interface CompareRowProps {
  label: string;
  icon: React.ReactNode;
  values: string[];
  highlightId?: string;
  propertyIds?: string[];
  highlightLabel?: string;
}

const CompareRow = ({ label, icon, values, highlightId, propertyIds, highlightLabel }: CompareRowProps) => (
  <>
    <div className="flex items-center gap-2 text-sm text-muted-foreground py-3 border-t">
      {icon}
      <span>{label}</span>
    </div>
    {values.map((value, index) => {
      const isHighlighted = highlightId && propertyIds && propertyIds[index] === highlightId;
      return (
        <div
          key={index}
          className={`text-center py-3 border-t ${
            isHighlighted ? 'bg-accent/10 font-medium text-accent' : ''
          }`}
        >
          <span className="text-sm">{value}</span>
          {isHighlighted && highlightLabel && (
            <p className="text-xs text-accent mt-0.5">{highlightLabel}</p>
          )}
        </div>
      );
    })}
  </>
);

export default PropertyCompareDialog;
