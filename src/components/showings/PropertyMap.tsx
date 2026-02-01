import { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

// Fix for default marker icons in Leaflet with webpack/vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface PropertyMapProps {
  properties: Array<{
    id: string;
    address: string;
    city: string | null;
    state: string | null;
    zip_code: string | null;
    price: number | null;
    order_index: number;
  }>;
}

interface GeocodedProperty {
  id: string;
  address: string;
  fullAddress: string;
  lat: number;
  lng: number;
  order_index: number;
  price: number | null;
}

// Custom numbered marker icon
const createNumberedIcon = (number: number) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: hsl(var(--primary));
        color: hsl(var(--primary-foreground));
        width: 28px;
        height: 28px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 12px;
        border: 2px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      ">
        ${number}
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
};

// Component to fit bounds when properties change
const FitBounds = ({ positions }: { positions: [number, number][] }) => {
  const map = useMap();
  
  useEffect(() => {
    if (positions.length > 0) {
      const bounds = L.latLngBounds(positions);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [positions, map]);
  
  return null;
};

const PropertyMap = ({ properties }: PropertyMapProps) => {
  const [geocodedProperties, setGeocodedProperties] = useState<GeocodedProperty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Geocode addresses using Edge Function
  useEffect(() => {
    const geocodeProperties = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Prepare addresses for geocoding
        const addressData = properties.map(property => ({
          id: property.id,
          address: [property.address, property.city, property.state, property.zip_code]
            .filter(Boolean)
            .join(', '),
        }));
        
        const { data, error: fnError } = await supabase.functions.invoke('geocode-address', {
          body: { addresses: addressData },
        });
        
        if (fnError) {
          console.error('Geocoding function error:', fnError);
          setError('Failed to locate properties');
          setIsLoading(false);
          return;
        }
        
        const results: GeocodedProperty[] = [];
        
        if (data?.results) {
          for (const geocoded of data.results) {
            const property = properties.find(p => p.id === geocoded.id);
            if (property) {
              const fullAddress = [property.address, property.city, property.state, property.zip_code]
                .filter(Boolean)
                .join(', ');
              
              results.push({
                id: property.id,
                address: property.address,
                fullAddress,
                lat: geocoded.lat,
                lng: geocoded.lng,
                order_index: property.order_index,
                price: property.price,
              });
            }
          }
        }
        
        setGeocodedProperties(results);
        
        if (results.length === 0 && properties.length > 0) {
          setError('Could not locate any properties on the map');
        }
      } catch (err) {
        console.error('Geocoding error:', err);
        setError('Failed to locate properties');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (properties.length > 0) {
      geocodeProperties();
    } else {
      setIsLoading(false);
    }
  }, [properties]);

  // Sort by order_index for route line
  const sortedProperties = useMemo(() => {
    return [...geocodedProperties].sort((a, b) => a.order_index - b.order_index);
  }, [geocodedProperties]);

  // Create route line positions
  const routePositions = useMemo((): [number, number][] => {
    return sortedProperties.map(p => [p.lat, p.lng]);
  }, [sortedProperties]);

  // Default center (US)
  const defaultCenter: [number, number] = [39.8283, -98.5795];
  const defaultZoom = 4;

  const formatPrice = (price: number | null) => {
    if (!price) return null;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(price);
  };

  if (isLoading) {
    return (
      <div className="h-[400px] rounded-xl bg-muted flex items-center justify-center">
        <div className="text-center">
          <MapPin className="w-8 h-8 text-muted-foreground animate-pulse mx-auto mb-2" />
          <p className="text-muted-foreground">Locating properties...</p>
        </div>
      </div>
    );
  }

  if (error || geocodedProperties.length === 0) {
    return (
      <div className="h-[400px] rounded-xl bg-muted flex items-center justify-center">
        <div className="text-center">
          <MapPin className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">{error || 'No properties to display'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden border border-border">
      <div className="bg-card px-4 py-3 border-b border-border flex items-center gap-2">
        <Navigation className="w-4 h-4 text-primary" />
        <span className="font-medium text-foreground">Route Map</span>
        <span className="text-muted-foreground text-sm">
          ({geocodedProperties.length} of {properties.length} located)
        </span>
      </div>
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        style={{ height: '400px', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Route line */}
        {routePositions.length > 1 && (
          <Polyline
            positions={routePositions}
            pathOptions={{
              color: 'hsl(var(--primary))',
              weight: 3,
              opacity: 0.7,
              dashArray: '10, 10',
            }}
          />
        )}
        
        {/* Property markers */}
        {sortedProperties.map((property, index) => (
          <Marker
            key={property.id}
            position={[property.lat, property.lng]}
            icon={createNumberedIcon(index + 1)}
          >
            <Popup>
              <div className="min-w-[200px]">
                <div className="flex items-center gap-1 mb-1">
                  <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded">
                    #{index + 1}
                  </span>
                </div>
                <p className="font-semibold text-foreground">{property.address}</p>
                <p className="text-sm text-muted-foreground">{property.fullAddress}</p>
                {property.price && (
                  <p className="text-sm font-medium text-primary mt-1">
                    {formatPrice(property.price)}
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
        
        <FitBounds positions={routePositions} />
      </MapContainer>
    </div>
  );
};

export default PropertyMap;
