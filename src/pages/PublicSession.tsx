import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Home, Calendar, MapPin, Star, FileText, ExternalLink, Image, Plus } from 'lucide-react';
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
  beds: number | null;
  baths: number | null;
  sqft: number | null;
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
        .select('full_name, avatar_url, slogan, bio, phone, email, license_number, brokerage_name, brokerage_address, brokerage_phone, brokerage_email, brokerage_logo_url, linkedin_url, instagram_url, facebook_url, twitter_url, youtube_url, website_url')
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
          <div className="max-w-3xl mx-auto space-y-8">
            {properties.map((property, index) => (
              <div
                key={property.id}
                className="bg-card rounded-2xl overflow-hidden card-elevated"
              >
                {/* Large Image */}
                <div className="relative aspect-[16/10] bg-muted">
                  {property.photo_url ? (
                    <img
                      src={property.photo_url}
                      alt={property.address}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Home className="w-16 h-16 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5">
                  {/* Header row: Badge, Date, Price */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 bg-primary text-primary-foreground rounded-md text-sm font-bold">
                        #{index + 1}
                      </span>
                      {session.session_date && (
                        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(session.session_date), 'MMM d · h:mm a')}
                        </span>
                      )}
                    </div>
                    {property.price && (
                      <span className="text-2xl font-display font-bold text-foreground">
                        {formatPrice(property.price)}
                      </span>
                    )}
                  </div>

                  {/* Address */}
                  <div className="flex items-start gap-2 mb-4">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <p className="font-display font-semibold text-foreground">
                      {property.address}
                      {property.city && `, ${property.city}`}
                      {property.state && `, ${property.state}`}
                      {property.zip_code && ` ${property.zip_code}`}
                    </p>
                  </div>

                  {/* Property Stats */}
                  {(property.beds || property.baths || property.sqft) && (
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      {property.beds && <span>{property.beds} Bd</span>}
                      {property.baths && <span>• {property.baths} Ba</span>}
                      {property.sqft && <span>• {property.sqft.toLocaleString()} Sq Ft</span>}
                    </div>
                  )}

                  {/* Agent's Note */}
                  {session.notes && (
                    <div className="bg-secondary rounded-xl p-4 mb-4">
                      <p className="text-xs text-muted-foreground mb-1">{agent?.full_name || 'Agent'}'s note</p>
                      <p className="text-sm text-foreground">{session.notes}</p>
                    </div>
                  )}

                  {/* Documents */}
                  {property.documents && property.documents.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mb-4 gap-2"
                      onClick={() => {
                        // Show first document for now
                        if (property.documents && property.documents[0]) {
                          handleViewDocument(property.documents[0].file_url, property.documents[0].name);
                        }
                      }}
                    >
                      <FileText className="w-4 h-4" />
                      DOCS ({property.documents.length})
                    </Button>
                  )}

                  {/* My Photos section */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Image className="w-4 h-4" />
                      <span className="text-sm">My Photos</span>
                    </div>
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <Plus className="w-4 h-4" />
                      ADD PHOTO
                    </Button>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" className="gap-2">
                      <ExternalLink className="w-4 h-4" />
                      VIEW DETAILS
                    </Button>
                    <Button
                      className="gap-2 bg-primary text-primary-foreground"
                      onClick={() => handleOpenFeedback(property)}
                    >
                      <Star className="w-4 h-4" />
                      {ratings[property.id] ? 'EDIT RATING' : 'RATE THIS HOME'}
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
