import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Home, Calendar, MapPin, Star } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface SessionProperty {
  id: string;
  address: string;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  price: number | null;
  photo_url: string | null;
  order_index: number;
}

interface ShowingSession {
  id: string;
  title: string;
  client_name: string;
  session_date: string | null;
  notes: string | null;
}

const PublicSession = () => {
  const { token } = useParams<{ token: string }>();
  const [session, setSession] = useState<ShowingSession | null>(null);
  const [properties, setProperties] = useState<SessionProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [ratings, setRatings] = useState<Record<string, number>>({});

  useEffect(() => {
    if (token) {
      fetchSession();
    }
  }, [token]);

  const fetchSession = async () => {
    try {
      // Fetch session by share token
      const { data: sessionData, error: sessionError } = await supabase
        .from('showing_sessions')
        .select('id, title, client_name, session_date, notes')
        .eq('share_token', token)
        .single();

      if (sessionError || !sessionData) {
        setNotFound(true);
        return;
      }

      setSession(sessionData);

      // Fetch properties
      const { data: propertiesData, error: propsError } = await supabase
        .from('session_properties')
        .select('*')
        .eq('session_id', sessionData.id)
        .order('order_index', { ascending: true });

      if (propsError) throw propsError;
      setProperties(propertiesData || []);

      // Fetch existing ratings
      const { data: ratingsData } = await supabase
        .from('property_ratings')
        .select('session_property_id, rating')
        .in('session_property_id', (propertiesData || []).map(p => p.id));

      const ratingsMap: Record<string, number> = {};
      ratingsData?.forEach(r => {
        ratingsMap[r.session_property_id] = r.rating || 0;
      });
      setRatings(ratingsMap);

    } catch (error) {
      toast.error('Failed to load session');
    } finally {
      setLoading(false);
    }
  };

  const handleRate = async (propertyId: string, rating: number) => {
    try {
      // Check if rating exists
      const { data: existing } = await supabase
        .from('property_ratings')
        .select('id')
        .eq('session_property_id', propertyId)
        .single();

      if (existing) {
        await supabase
          .from('property_ratings')
          .update({ rating })
          .eq('id', existing.id);
      } else {
        await supabase.from('property_ratings').insert({
          session_property_id: propertyId,
          rating,
        });
      }

      setRatings(prev => ({ ...prev, [propertyId]: rating }));
      toast.success('Rating saved!');
    } catch (error) {
      toast.error('Failed to save rating');
    }
  };

  const formatPrice = (price: number | null) => {
    if (!price) return null;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (notFound || !session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <Home className="w-8 h-8 text-muted-foreground" />
          </div>
          <h1 className="font-display text-2xl font-semibold text-foreground mb-2">
            Session Not Found
          </h1>
          <p className="text-muted-foreground mb-6">
            This showing session link may be invalid or expired.
          </p>
          <Link to="/">
            <Button>Go to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 mb-4">
            <Home className="w-5 h-5" />
            <span className="font-display text-lg">HomeFolio</span>
          </div>
          <h1 className="font-display text-3xl font-bold mb-2">
            {session.title}
          </h1>
          <p className="text-primary-foreground/80">
            Welcome, {session.client_name}
          </p>
          {session.session_date && (
            <p className="flex items-center gap-2 text-primary-foreground/80 mt-2">
              <Calendar className="w-4 h-4" />
              {format(new Date(session.session_date), 'EEEE, MMMM d, yyyy')}
            </p>
          )}
          {session.notes && (
            <p className="mt-4 text-primary-foreground/90 bg-primary-foreground/10 p-4 rounded-lg">
              {session.notes}
            </p>
          )}
        </div>
      </header>

      {/* Properties */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="font-display text-xl font-semibold text-foreground mb-6">
          Properties ({properties.length})
        </h2>

        {properties.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property, index) => (
              <div
                key={property.id}
                className="bg-card rounded-2xl overflow-hidden card-elevated"
              >
                {/* Image */}
                <div className="relative aspect-[4/3] bg-muted">
                  {property.photo_url ? (
                    <img
                      src={property.photo_url}
                      alt={property.address}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Home className="w-12 h-12 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute top-3 left-3">
                    <span className="px-3 py-1 bg-card/90 backdrop-blur-sm rounded-lg text-sm font-semibold">
                      #{index + 1}
                    </span>
                  </div>
                  {property.price && (
                    <div className="absolute bottom-3 left-3">
                      <span className="px-3 py-1.5 bg-card/90 backdrop-blur-sm rounded-lg font-semibold text-accent">
                        {formatPrice(property.price)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-display font-semibold text-foreground mb-1">
                    {property.address}
                  </h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mb-4">
                    <MapPin className="w-3.5 h-3.5" />
                    {[property.city, property.state, property.zip_code]
                      .filter(Boolean)
                      .join(', ') || 'Location TBD'}
                  </p>

                  {/* Rating */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Your rating:</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => handleRate(property.id, star)}
                          className="focus:outline-none"
                        >
                          <Star
                            className={`w-5 h-5 transition-colors ${
                              star <= (ratings[property.id] || 0)
                                ? 'fill-gold text-gold'
                                : 'text-muted-foreground hover:text-gold'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-card rounded-xl">
            <Home className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No properties have been added to this session yet.
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-muted py-6 mt-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            Powered by{' '}
            <Link to="/" className="text-accent hover:underline">
              HomeFolio
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default PublicSession;
