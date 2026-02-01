import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Home, Calendar, MapPin, Star, FileText, ExternalLink, User } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import PropertyFeedbackDialog from '@/components/public/PropertyFeedbackDialog';
import { AgentProfileCard, AgentProfile } from '@/components/public/AgentProfileCard';

interface FeedbackData {
  topThingsLiked?: string;
  concerns?: string;
  lifestyleFit?: 'yes' | 'no' | 'not_sure';
  layoutThoughts?: string;
  priceFeel?: 'too_high' | 'fair' | 'great_value';
  neighborhoodThoughts?: string;
  conditionConcerns?: string;
  nextStep?: 'see_again' | 'write_offer' | 'keep_looking' | 'sleep_on_it';
  investigateRequest?: string;
}

interface PropertyDocument {
  id: string;
  name: string;
  doc_type: string | null;
  file_url: string;
}

interface SessionProperty {
  id: string;
  address: string;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  price: number | null;
  photo_url: string | null;
  order_index: number;
  documents?: PropertyDocument[];
}

interface ShowingSession {
  id: string;
  title: string;
  client_name: string;
  session_date: string | null;
  notes: string | null;
  admin_id: string;
}

interface PropertyRating {
  rating: number;
  feedback: FeedbackData;
}

const PublicSession = () => {
  const { token } = useParams<{ token: string }>();
  const [session, setSession] = useState<ShowingSession | null>(null);
  const [properties, setProperties] = useState<SessionProperty[]>([]);
  const [agent, setAgent] = useState<AgentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [ratings, setRatings] = useState<Record<string, PropertyRating>>({});
  
  // Feedback dialog state
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [activeProperty, setActiveProperty] = useState<SessionProperty | null>(null);

  useEffect(() => {
    if (token) {
      fetchSession();
    }
  }, [token]);

  const fetchSession = async () => {
    try {
      // Fetch session by share token (include admin_id)
      const { data: sessionData, error: sessionError } = await supabase
        .from('showing_sessions')
        .select('id, title, client_name, session_date, notes, admin_id')
        .eq('share_token', token)
        .single();

      if (sessionError || !sessionData) {
        setNotFound(true);
        return;
      }

      setSession(sessionData);

      // Fetch agent profile
      const { data: agentData } = await supabase
        .from('profiles')
        .select('full_name, avatar_url, slogan, bio, phone, email, license_number, brokerage_name, brokerage_address, brokerage_phone, brokerage_email, brokerage_logo_url')
        .eq('user_id', sessionData.admin_id)
        .maybeSingle();

      if (agentData) {
        setAgent(agentData as unknown as AgentProfile);
      }

      // Fetch properties
      const { data: propertiesData, error: propsError } = await supabase
        .from('session_properties')
        .select('*')
        .eq('session_id', sessionData.id)
        .order('order_index', { ascending: true });

      if (propsError) throw propsError;

      // Fetch documents for all properties
      const propertyIds = (propertiesData || []).map(p => p.id);
      const { data: docsData } = await supabase
        .from('property_documents')
        .select('id, name, doc_type, file_url, session_property_id')
        .in('session_property_id', propertyIds);

      // Group documents by property
      const docsByProperty: Record<string, PropertyDocument[]> = {};
      docsData?.forEach(doc => {
        if (!docsByProperty[doc.session_property_id]) {
          docsByProperty[doc.session_property_id] = [];
        }
        docsByProperty[doc.session_property_id].push(doc);
      });

      // Attach documents to properties
      const propertiesWithDocs = (propertiesData || []).map(p => ({
        ...p,
        documents: docsByProperty[p.id] || [],
      }));
      setProperties(propertiesWithDocs);

      // Fetch existing ratings with feedback
      const { data: ratingsData } = await supabase
        .from('property_ratings')
        .select('session_property_id, rating, feedback')
        .in('session_property_id', (propertiesData || []).map(p => p.id));

      const ratingsMap: Record<string, PropertyRating> = {};
      ratingsData?.forEach(r => {
        let parsedFeedback: FeedbackData = {};
        if (r.feedback) {
          try {
            parsedFeedback = JSON.parse(r.feedback);
          } catch {
            parsedFeedback = {};
          }
        }
        ratingsMap[r.session_property_id] = {
          rating: r.rating || 5,
          feedback: parsedFeedback,
        };
      });
      setRatings(ratingsMap);

    } catch (error) {
      toast.error('Failed to load session');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenFeedback = (property: SessionProperty) => {
    setActiveProperty(property);
    setFeedbackOpen(true);
  };

  const handleFeedbackSaved = () => {
    // Refetch ratings after save
    fetchRatings();
  };

  const fetchRatings = async () => {
    if (!properties.length) return;
    const { data: ratingsData } = await supabase
      .from('property_ratings')
      .select('session_property_id, rating, feedback')
      .in('session_property_id', properties.map(p => p.id));

    const ratingsMap: Record<string, PropertyRating> = {};
    ratingsData?.forEach(r => {
      let parsedFeedback: FeedbackData = {};
      if (r.feedback) {
        try {
          parsedFeedback = JSON.parse(r.feedback);
        } catch {
          parsedFeedback = {};
        }
      }
      ratingsMap[r.session_property_id] = {
        rating: r.rating || 5,
        feedback: parsedFeedback,
      };
    });
    setRatings(ratingsMap);
  };

  const formatPrice = (price: number | null) => {
    if (!price) return null;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const handleViewDocument = async (fileUrl: string, docName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('property-documents')
        .createSignedUrl(fileUrl, 3600);

      if (error) throw error;
      window.open(data.signedUrl, '_blank');
    } catch (error) {
      toast.error('Failed to open document');
    }
  };

  const getDocTypeLabel = (type: string | null) => {
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

      {/* Agent Profile */}
      {agent && (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-10">
          <AgentProfileCard agent={agent} />
        </div>
      )}

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

                  {/* Documents */}
                  {property.documents && property.documents.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5" />
                        Documents ({property.documents.length})
                      </h4>
                      <div className="space-y-1.5">
                        {property.documents.map((doc) => (
                          <button
                            key={doc.id}
                            onClick={() => handleViewDocument(doc.file_url, doc.name)}
                            className="w-full flex items-center justify-between p-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors text-left"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <FileText className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                              <span className="text-sm text-foreground truncate">{doc.name}</span>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="text-xs text-muted-foreground px-1.5 py-0.5 rounded bg-muted">
                                {getDocTypeLabel(doc.doc_type)}
                              </span>
                              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Rating Summary & Button */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Rating:</span>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => {
                          const rating = ratings[property.id]?.rating || 0;
                          const filled = star <= Math.round(rating / 2);
                          return (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${
                                filled ? 'fill-gold text-gold' : 'text-muted-foreground'
                              }`}
                            />
                          );
                        })}
                      </div>
                      {ratings[property.id]?.rating && (
                        <span className="text-xs text-muted-foreground">
                          ({ratings[property.id].rating}/10)
                        </span>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenFeedback(property)}
                      className="gap-1.5"
                    >
                      <Star className="w-3.5 h-3.5" />
                      {ratings[property.id] ? 'Edit' : 'Rate'}
                    </Button>
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
      {/* Feedback Dialog */}
      {activeProperty && (
        <PropertyFeedbackDialog
          open={feedbackOpen}
          onOpenChange={setFeedbackOpen}
          propertyId={activeProperty.id}
          propertyAddress={activeProperty.address}
          existingRating={ratings[activeProperty.id]?.rating || 5}
          existingFeedback={ratings[activeProperty.id]?.feedback}
          onSaved={handleFeedbackSaved}
        />
      )}
    </div>
  );
};

export default PublicSession;
