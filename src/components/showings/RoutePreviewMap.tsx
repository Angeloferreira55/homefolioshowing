import { useMemo } from "react";
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Navigation, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useEffect } from "react";

// Fix for default marker icons in Leaflet with Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface RouteCoordinate {
  id: string;
  lat: number;
  lng: number;
}

interface Property {
  id: string;
  address: string;
  order_index: number;
  price: number | null;
}

interface RoutePreviewMapProps {
  routeCoordinates: RouteCoordinate[];
  properties: Property[];
  legDurations: Array<{ from: string; to: string; seconds: number }>;
  onClose: () => void;
}

const createNumberedIcon = (number: number, isSpecial?: boolean) =>
  L.divIcon({
    className: "custom-marker",
    html: `
      <div style="
        background-color: ${isSpecial ? '#16a34a' : '#2563eb'};
        color: white;
        width: 32px;
        height: 32px;
        border-radius: 9999px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 13px;
        border: 3px solid white;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
      ">
        ${number}
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });

const createSpecialIcon = (label: string) =>
  L.divIcon({
    className: "custom-marker",
    html: `
      <div style="
        background-color: #16a34a;
        color: white;
        padding: 4px 10px;
        border-radius: 9999px;
        font-weight: 600;
        font-size: 11px;
        border: 2px solid white;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        white-space: nowrap;
      ">
        ${label}
      </div>
    `,
    iconSize: [60, 24],
    iconAnchor: [30, 12],
    popupAnchor: [0, -12],
  });

const FitBounds = ({ positions }: { positions: [number, number][] }) => {
  const map = useMap();

  useEffect(() => {
    if (!positions.length) return;
    const bounds = L.latLngBounds(positions);
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [positions, map]);

  return null;
};

const formatPrice = (price: number | null) => {
  if (!price) return null;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price);
};

const formatDuration = (seconds: number) => {
  const mins = Math.round(seconds / 60);
  if (mins >= 60) {
    const hours = Math.floor(mins / 60);
    const remaining = mins % 60;
    return `${hours}h ${remaining}m`;
  }
  return `${mins}m`;
};

const defaultCenter: [number, number] = [39.8283, -98.5795];
const defaultZoom = 4;

export default function RoutePreviewMap({
  routeCoordinates,
  properties,
  legDurations,
  onClose,
}: RoutePreviewMapProps) {
  const routePositions = useMemo((): [number, number][] => {
    if (!Array.isArray(routeCoordinates)) return [];
    return routeCoordinates
      .filter((c) => c && typeof c.lat === 'number' && typeof c.lng === 'number' && !isNaN(c.lat) && !isNaN(c.lng))
      .map((c) => [c.lat, c.lng]);
  }, [routeCoordinates]);

  const totalSeconds = useMemo(() => {
    if (!Array.isArray(legDurations)) return 0;
    return legDurations.reduce((sum, leg) => sum + (leg?.seconds || 0), 0);
  }, [legDurations]);

  const propertyCount = useMemo(() => {
    if (!Array.isArray(routeCoordinates)) return 0;
    return routeCoordinates.filter(
      (c) => c && c.id !== "__origin__" && c.id !== "__destination__"
    ).length;
  }, [routeCoordinates]);

  // Safety check - don't render if we have no valid coordinates
  if (!Array.isArray(routeCoordinates) || routeCoordinates.length === 0 || routePositions.length === 0) {
    return null;
  }

  return (
    <Card className="overflow-hidden border-border">
      <div className="bg-card px-4 py-3 border-b border-border flex items-center gap-2">
        <Navigation className="w-4 h-4 text-primary" />
        <span className="font-medium text-foreground">Optimized Route</span>
        <span className="text-muted-foreground text-sm">
          ({propertyCount} stops • {formatDuration(totalSeconds)} total)
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="ml-auto h-7 w-7 p-0"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        style={{ height: "350px", width: "100%" }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {routePositions.length > 1 && (
          <Polyline
            positions={routePositions}
            pathOptions={{
              color: "#2563eb",
              weight: 4,
              opacity: 0.8,
            }}
          />
        )}

        {routeCoordinates.map((coord, index) => {
          const isOrigin = coord.id === "__origin__";
          const isDestination = coord.id === "__destination__";
          const property = properties.find((p) => p.id === coord.id);

          let icon: L.DivIcon;
          let popupContent: React.ReactNode;

          if (isOrigin) {
            icon = createSpecialIcon("Start");
            popupContent = (
              <div className="min-w-[120px]">
                <p className="font-semibold text-primary">Starting Point</p>
              </div>
            );
          } else if (isDestination) {
            icon = createSpecialIcon("End");
            popupContent = (
              <div className="min-w-[120px]">
                <p className="font-semibold text-primary">Ending Point</p>
              </div>
            );
          } else if (property) {
            const stopNumber = routeCoordinates
              .slice(0, index)
              .filter((c) => c.id !== "__origin__" && c.id !== "__destination__")
              .length + 1;
            icon = createNumberedIcon(stopNumber);
            
            // Find leg duration to next stop
            const nextLeg = legDurations.find((leg) => leg.from === coord.id);
            
            popupContent = (
              <div className="min-w-[200px]">
                <div className="flex items-center gap-1 mb-1">
                  <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded">
                    Stop #{stopNumber}
                  </span>
                </div>
                <p className="font-semibold text-foreground">{property.address}</p>
                {property.price && (
                  <p className="text-sm font-medium text-primary mt-1">
                    {formatPrice(property.price)}
                  </p>
                )}
                {nextLeg && (
                  <p className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                    → Next stop: {formatDuration(nextLeg.seconds)}
                  </p>
                )}
              </div>
            );
          } else {
            return null;
          }

          return (
            <Marker key={`${coord.id}-${index}`} position={[coord.lat, coord.lng]} icon={icon}>
              <Popup>{popupContent}</Popup>
            </Marker>
          );
        })}

        <FitBounds positions={routePositions} />
      </MapContainer>
    </Card>
  );
}
