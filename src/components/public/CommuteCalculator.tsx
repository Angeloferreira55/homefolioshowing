import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Car, 
  PersonStanding, 
  Train, 
  MapPin, 
  Clock, 
  Navigation,
  Loader2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type TransportMode = 'driving' | 'walking' | 'transit';

interface CommuteResult {
  origin: string;
  destination: string;
  duration_text: string;
  duration_minutes: number;
  distance_text: string;
  distance_meters: number;
  mode: string;
}

interface PropertyForCommute {
  id: string;
  address: string;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
}

interface CommuteCalculatorProps {
  properties: PropertyForCommute[];
  className?: string;
}

export default function CommuteCalculator({ properties, className }: CommuteCalculatorProps) {
  const [destination, setDestination] = useState('');
  const [mode, setMode] = useState<TransportMode>('driving');
  const [results, setResults] = useState<CommuteResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const buildFullAddress = (p: PropertyForCommute) => {
    return [p.address, p.city, p.state, p.zip_code].filter(Boolean).join(', ');
  };

  const handleCalculate = async () => {
    if (!destination.trim()) {
      toast.error('Please enter a destination address');
      return;
    }

    if (properties.length === 0) {
      toast.error('No properties to calculate commute for');
      return;
    }

    setLoading(true);
    try {
      const origins = properties.map(buildFullAddress);

      const { data, error } = await supabase.functions.invoke('calculate-commute', {
        body: {
          origins,
          destination: destination.trim(),
          mode,
        },
      });

      if (error) throw error;

      if (data?.results) {
        setResults(data.results);
        setExpanded(true);
      }
    } catch (err) {
      console.error('Commute calculation error:', err);
      toast.error('Failed to calculate commute times');
    } finally {
      setLoading(false);
    }
  };

  const getResultForProperty = (property: PropertyForCommute): CommuteResult | undefined => {
    const fullAddress = buildFullAddress(property);
    return results.find(r => r.origin === fullAddress);
  };

  const getModeIcon = (m: TransportMode) => {
    switch (m) {
      case 'driving':
        return <Car className="w-4 h-4" />;
      case 'walking':
        return <PersonStanding className="w-4 h-4" />;
      case 'transit':
        return <Train className="w-4 h-4" />;
    }
  };

  const sortedResults = [...results].sort((a, b) => a.duration_minutes - b.duration_minutes);
  const fastestResult = sortedResults[0];

  return (
    <Card className={cn("border-border", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="font-display text-lg flex items-center gap-2">
          <Navigation className="w-5 h-5 text-primary" />
          Commute Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Destination Input */}
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">
            Calculate commute times to:
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Work, school, or any address..."
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="pl-9"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCalculate();
                }}
              />
            </div>
          </div>
        </div>

        {/* Transport Mode Selector */}
        <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
          {(['driving', 'transit', 'walking'] as TransportMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors",
                mode === m 
                  ? "bg-background text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {getModeIcon(m)}
              <span className="capitalize hidden sm:inline">{m}</span>
            </button>
          ))}
        </div>

        {/* Calculate Button */}
        <Button 
          onClick={handleCalculate} 
          disabled={loading || !destination.trim()}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Calculating...
            </>
          ) : (
            <>
              <Clock className="w-4 h-4 mr-2" />
              Calculate Commute Times
            </>
          )}
        </Button>

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-3 pt-2">
            {/* Quickest commute badge */}
            {fastestResult && fastestResult.duration_minutes > 0 && (
              <div className="bg-accent/10 border border-accent/20 rounded-lg p-3">
                <p className="text-xs text-accent font-semibold uppercase tracking-wide mb-1">
                  Quickest Commute
                </p>
                <p className="font-medium text-foreground text-sm truncate">
                  {properties.find(p => buildFullAddress(p) === fastestResult.origin)?.address}
                </p>
                <p className="text-lg font-display font-bold text-accent">
                  {fastestResult.duration_text}
                </p>
              </div>
            )}

            {/* Expandable results list */}
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center justify-between w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <span>All commute times ({results.length})</span>
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {expanded && (
              <div className="space-y-2">
                {sortedResults.map((result, index) => {
                  const property = properties.find(p => buildFullAddress(p) === result.origin);
                  const isFastest = index === 0 && result.duration_minutes > 0;
                  
                  return (
                    <div
                      key={result.origin}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg border",
                        isFastest ? "border-accent/30 bg-accent/5" : "border-border bg-muted/30"
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">
                          {property?.address || result.origin}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {result.distance_text}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0 ml-3">
                        <p className={cn(
                          "font-display font-semibold",
                          isFastest ? "text-accent" : "text-foreground"
                        )}>
                          {result.duration_text}
                        </p>
                        <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
                          {getModeIcon(result.mode as TransportMode)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center">
          Estimated times based on typical traffic conditions
        </p>
      </CardContent>
    </Card>
  );
}
