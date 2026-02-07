import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Home, Calendar, MapPin, Star, FileText, ExternalLink, Image, Scale, Heart, Navigation, Clock, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import PropertyFeedbackDialog from '@/components/public/PropertyFeedbackDialog';
import { AgentProfileCard, AgentProfile } from '@/components/public/AgentProfileCard';
import PropertyDocumentsDrawer from '@/components/public/PropertyDocumentsDrawer';
import PublicPropertyDetailDialog, {
  PublicPropertyDocument,
  PublicSessionProperty,
} from '@/components/public/PublicPropertyDetailDialog';
import PublicSessionSkeleton from '@/components/skeletons/PublicSessionSkeleton';
import PropertyCompareDialog from '@/components/public/PropertyCompareDialog';

import AccessCodeForm from '@/components/public/AccessCodeForm';
import { trackEvent } from '@/hooks/useAnalytics';
import { useBuyerFavorites } from '@/hooks/useBuyerFavorites';
import logoImage from '@/assets/homefolio-logo.png';
import { logError } from '@/lib/errorLogger';

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

type PropertyDocument = PublicPropertyDocument;
type SessionProperty = PublicSessionProperty & { 
  order_index: number;
  client_photos?: ClientPhoto[];
  showing_time?: string | null;
};

interface ClientPhoto {
  id: string;
  file_url: string;
  caption: string | null;
  created_at: string;
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
  const [loadError, setLoadError] = useState<string | null>(null);
  const [ratings, setRatings] = useState<Record<string, PropertyRating>>({});
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 2;
  
  // Password protection state
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [accessGranted, setAccessGranted] = useState(false);
  
  // Feedback dialog state
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [activeProperty, setActiveProperty] = useState<SessionProperty | null>(null);

  // Detail dialog state
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailProperty, setDetailProperty] = useState<SessionProperty | null>(null);

  // Documents drawer state
  const [docsOpen, setDocsOpen] = useState(false);
  const [docsProperty, setDocsProperty] = useState<SessionProperty | null>(null);

  // Compare dialog state
  const [compareOpen, setCompareOpen] = useState(false);


  // Favorites
  const { toggleFavorite, isFavorite, getFavoriteCount } = useBuyerFavorites(token);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Helper to get/set cached access with 2-hour expiration
  const ACCESS_CACHE_KEY = `homefolio_access_${token}`;
  const ACCESS_EXPIRY_MS = 2 * 60 * 60 * 1000; // 2 hours

  const getCachedAccess = (): boolean => {
    try {
      const cached = localStorage.getItem(ACCESS_CACHE_KEY);
      if (!cached) return false;
      const { expiresAt } = JSON.parse(cached);
      if (Date.now() > expiresAt) {
        localStorage.removeItem(ACCESS_CACHE_KEY);
        return false;
      }
      return true;
    } catch {
      return false;
    }
  };

  const setCachedAccess = () => {
    try {
      localStorage.setItem(ACCESS_CACHE_KEY, JSON.stringify({
        expiresAt: Date.now() + ACCESS_EXPIRY_MS,
      }));
    } catch {
      // localStorage may be unavailable in private browsing
    }
  };

  const fetchSession = useCallback(async (attempt = 0) => {
    setLoadError(null);
    
    try {
      // Use secure RPC function that excludes client contact info
      const { data: sessionResult, error: sessionError } = await supabase
        .rpc('get_public_session', { p_share_token: token });

      const sessionData = sessionResult?.[0];

      if (sessionError) {
        logError(sessionError, { context: 'PublicSession.fetchSession', token, attempt });
        throw sessionError;
      }

      if (!sessionData) {
        // Session truly doesn't exist
        setNotFound(true);
        setLoading(false);
        return;
      }

      setSession(sessionData);

      // Fetch agent profile from public view (excludes sensitive data like license_number, MLS credentials)
      const { data: agentData, error: agentError } = await supabase
        .from('public_agent_profile')
        .select('full_name, avatar_url, slogan, bio, phone, email, brokerage_name, brokerage_address, brokerage_phone, brokerage_email, brokerage_logo_url, linkedin_url, instagram_url, facebook_url, twitter_url, youtube_url, website_url')
        .eq('user_id', sessionData.admin_id)
        .maybeSingle();

      if (agentError) {
        logError(agentError, { context: 'PublicSession.fetchAgent', adminId: sessionData.admin_id });
        // Non-critical - continue without agent data
      }

      if (agentData) {
        setAgent(agentData as unknown as AgentProfile);
      }

      // Fetch properties
      const { data: propertiesData, error: propsError } = await supabase
        .from('session_properties')
        .select('*')
        .eq('session_id', sessionData.id)
        .order('order_index', { ascending: true });

      if (propsError) {
        logError(propsError, { context: 'PublicSession.fetchProperties', sessionId: sessionData.id });
        throw propsError;
      }

      // Fetch documents for all properties
      const propertyIds = (propertiesData || []).map(p => p.id);
      
      // Fetch documents and client photos in parallel
      const [docsResult, photosResult] = await Promise.all([
        propertyIds.length > 0 
          ? supabase
              .from('property_documents')
              .select('id, name, doc_type, file_url, session_property_id')
              .in('session_property_id', propertyIds)
          : Promise.resolve({ data: [], error: null }),
        propertyIds.length > 0
          ? supabase
              .from('client_photos')
              .select('id, file_url, caption, created_at, session_property_id')
              .in('session_property_id', propertyIds)
              .order('created_at', { ascending: false })
          : Promise.resolve({ data: [], error: null })
      ]);

      // Log but don't fail on document/photo errors
      if (docsResult.error) {
        logError(docsResult.error, { context: 'PublicSession.fetchDocuments' });
      }
      if (photosResult.error) {
        logError(photosResult.error, { context: 'PublicSession.fetchPhotos' });
      }

      // Group documents by property
      const docsByProperty: Record<string, PropertyDocument[]> = {};
      (docsResult.data || []).forEach(doc => {
        if (!docsByProperty[doc.session_property_id]) {
          docsByProperty[doc.session_property_id] = [];
        }
        docsByProperty[doc.session_property_id].push(doc);
      });

      // Group client photos by property
      const photosByProperty: Record<string, ClientPhoto[]> = {};
      (photosResult.data || []).forEach(photo => {
        if (!photosByProperty[photo.session_property_id]) {
          photosByProperty[photo.session_property_id] = [];
        }
        photosByProperty[photo.session_property_id].push({
          id: photo.id,
          file_url: photo.file_url,
          caption: photo.caption,
          created_at: photo.created_at,
        });
      });

      // Attach documents and photos to properties
      const propertiesWithExtras = (propertiesData || []).map(p => ({
        ...p,
        documents: docsByProperty[p.id] || [],
        client_photos: photosByProperty[p.id] || [],
      }));
      setProperties(propertiesWithExtras);

      // Fetch existing ratings with feedback
      if (propertyIds.length > 0) {
        const { data: ratingsData, error: ratingsError } = await supabase
          .from('property_ratings')
          .select('session_property_id, rating, feedback')
          .in('session_property_id', propertyIds);

        if (ratingsError) {
          logError(ratingsError, { context: 'PublicSession.fetchRatings' });
          // Non-critical - continue without ratings
        }

        const ratingsMap: Record<string, PropertyRating> = {};
        (ratingsData || []).forEach(r => {
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
      }

      // Track session view
      trackEvent({
        eventType: 'session_view',
        sessionId: sessionData.id,
        adminId: sessionData.admin_id,
        metadata: { client_name: sessionData.client_name },
      });

      // Success - reset retry count
      setRetryCount(0);
      setLoading(false);

    } catch (error) {
      logError(error, { context: 'PublicSession.fetchSession', token, attempt });
      
      // Retry logic for network errors
      if (attempt < MAX_RETRIES) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff: 1s, 2s
        setTimeout(() => {
          setRetryCount(attempt + 1);
          fetchSession(attempt + 1);
        }, delay);
        return;
      }
      
      // Max retries reached
      setLoadError('Unable to load session. Please check your connection and try again.');
      setLoading(false);
    }
  }, [token]);

  const checkPasswordProtection = useCallback(async (attempt = 0) => {
    try {
      // First check if session exists using public view
      const { data: sessionExists, error: sessionError } = await supabase
        .from('public_session_info')
        .select('id')
        .eq('share_token', token)
        .maybeSingle();

      if (sessionError) {
        logError(sessionError, { context: 'PublicSession.checkPasswordProtection', token, attempt });
        
        // Retry on network errors
        if (attempt < MAX_RETRIES) {
          const delay = Math.pow(2, attempt) * 1000;
          setTimeout(() => checkPasswordProtection(attempt + 1), delay);
          return;
        }
        
        setLoadError('Unable to verify session. Please check your connection.');
        setLoading(false);
        return;
      }

      if (!sessionExists) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      // Check if password is required using secure RPC function
      const { data: requiresPass, error: passError } = await supabase
        .rpc('check_session_password_required', { p_share_token: token });

      if (passError) {
        logError(passError, { context: 'PublicSession.checkPassword', token });
        
        // Retry on network errors
        if (attempt < MAX_RETRIES) {
          const delay = Math.pow(2, attempt) * 1000;
          setTimeout(() => checkPasswordProtection(attempt + 1), delay);
          return;
        }
        
        setLoadError('Unable to verify session access. Please try again.');
        setLoading(false);
        return;
      }

      if (requiresPass) {
        // Check if we have cached access
        if (getCachedAccess()) {
          setAccessGranted(true);
          fetchSession(0);
        } else {
          setRequiresPassword(true);
          setLoading(false);
        }
      } else {
        // No password required, fetch the full session
        setAccessGranted(true);
        fetchSession(0);
      }
    } catch (error) {
      logError(error, { context: 'PublicSession.checkPasswordProtection', token, attempt });
      
      if (attempt < MAX_RETRIES) {
        const delay = Math.pow(2, attempt) * 1000;
        setTimeout(() => checkPasswordProtection(attempt + 1), delay);
        return;
      }
      
      setLoadError('Unable to load session. Please check your connection and try again.');
      setLoading(false);
    }
  }, [token, fetchSession]);

  useEffect(() => {
    if (token) {
      checkPasswordProtection(0);
    }
  }, [token, checkPasswordProtection]);

  const handlePasswordSubmit = async (password: string) => {
    setIsVerifying(true);
    setPasswordError(null);

    try {
      const { data, error } = await supabase
        .rpc('verify_share_access', { p_share_token: token, p_password: password });

      if (error) throw error;

      if (data) {
        // Cache access for 2 hours
        setCachedAccess();
        setAccessGranted(true);
        setRequiresPassword(false);
        setLoading(true);
        fetchSession(0);
      } else {
        setPasswordError('Invalid access code. Please try again.');
      }
    } catch (error) {
      setPasswordError('Something went wrong. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleOpenFeedback = (property: SessionProperty) => {
    setActiveProperty(property);
    setFeedbackOpen(true);
    
    // Track property rating interaction
    if (session) {
      trackEvent({
        eventType: 'property_rating',
        sessionId: session.id,
        propertyId: property.id,
        adminId: session.admin_id,
        metadata: { address: property.address },
      });
    }
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

  const formatShowingTime = (time: string | null | undefined) => {
    if (!time) return null;
    // Convert 24h format (HH:mm:ss or HH:mm) to 12h format
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
  };

  const handleViewDocument = async (doc: PropertyDocument) => {
    try {
      if (!token) {
        toast.error('Invalid link');
        return;
      }

      // Track document view
      if (session) {
        trackEvent({
          eventType: 'document_view',
          sessionId: session.id,
          adminId: session.admin_id,
          metadata: { doc_name: doc.name, doc_type: doc.doc_type },
        });
      }

      toast.loading('Opening document...', { id: 'doc-loading' });

      const { data, error } = await supabase.functions.invoke('public-doc-url', {
        body: {
          token,
          docId: doc.id,
          expiresInSeconds: 3600,
        },
      });

      toast.dismiss('doc-loading');

      if (error) throw error;
      if (!data?.signedUrl) throw new Error('Failed to open document');

      // Prefer same-tab navigation (most reliable on iOS) and avoid popup blockers.
      window.location.assign(data.signedUrl);
    } catch (error) {
      console.error('Document error:', error);
      toast.dismiss('doc-loading');
      toast.error('Failed to open document');
    }
  };

  const handleDownloadDocument = async (doc: PropertyDocument) => {
    try {
      if (!token) {
        toast.error('Invalid link');
        return;
      }

      toast.loading('Preparing download...', { id: 'doc-dl' });
      const { data, error } = await supabase.functions.invoke('public-doc-url', {
        body: {
          token,
          docId: doc.id,
          expiresInSeconds: 3600,
        },
      });
      toast.dismiss('doc-dl');

      if (error) throw error;
      if (!data?.signedUrl) throw new Error('Failed to download document');

      // Download hint (works on many browsers; iOS may still open in viewer)
      const a = document.createElement('a');
      a.href = data.signedUrl;
      a.download = doc.name || 'document';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download document error:', error);
      toast.dismiss('doc-dl');
      toast.error('Failed to download document');
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

  // Show password form if required
  if (requiresPassword && !accessGranted) {
    return (
      <AccessCodeForm
        onSubmit={handlePasswordSubmit}
        isLoading={isVerifying}
        error={passwordError}
      />
    );
  }

  if (loading) {
    return <PublicSessionSkeleton />;
  }

  // Show error state with retry option
  if (loadError && !session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <RefreshCw className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="font-display text-2xl font-semibold text-foreground mb-2">
            Connection Issue
          </h1>
          <p className="text-muted-foreground mb-6">
            {loadError}
          </p>
          <div className="flex flex-col gap-3">
            <Button 
              onClick={() => {
                setLoading(true);
                setLoadError(null);
                fetchSession(0);
              }}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </Button>
            <Link to="/">
              <Button variant="outline" className="w-full">Go to Home</Button>
            </Link>
          </div>
        </div>
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
    <div className="min-h-[100dvh] bg-background safe-area-top safe-area-bottom">
      {/* Header */}
      <header className="bg-primary text-primary-foreground py-6 sm:py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-3 sm:mb-4">
            <img 
              src={logoImage} 
              alt="HomeFolio" 
              className="h-14 sm:h-[72px] w-auto brightness-0 invert"
            />
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">
            {session.title}
          </h1>
          <p className="text-primary-foreground/80 text-sm sm:text-base">
            Welcome, {session.client_name}
          </p>
          {session.session_date && (() => {
            const [year, month, day] = session.session_date.split('-').map(Number);
            const localDate = new Date(year, month - 1, day);
            return (
              <p className="flex items-center gap-2 text-primary-foreground/80 mt-2 text-sm sm:text-base">
                <Calendar className="w-4 h-4" />
                {format(localDate, 'EEEE, MMMM d, yyyy')}
              </p>
            );
          })()}
          {session.notes && (
            <p className="mt-3 sm:mt-4 text-primary-foreground/90 bg-primary-foreground/10 p-3 sm:p-4 rounded-lg text-sm sm:text-base">
              {session.notes}
            </p>
          )}
        </div>
      </header>

      {/* Agent Profile */}
      {agent && (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 -mt-4 sm:-mt-6 relative z-10">
          <AgentProfileCard agent={agent} />
        </div>
      )}

      {/* Daily Schedule Summary */}
      {(() => {
        const propertiesWithTimes = properties
          .filter(p => p.showing_time)
          .sort((a, b) => a.order_index - b.order_index);
        
        if (propertiesWithTimes.length === 0) return null;
        
        return (
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 mt-4 sm:mt-6">
            <div className="bg-card rounded-xl sm:rounded-2xl p-4 sm:p-5 card-elevated">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                <h3 className="font-display font-semibold text-foreground text-sm sm:text-base">
                  Today's Schedule
                </h3>
              </div>
              <div className="space-y-2 sm:space-y-3">
                {propertiesWithTimes.map((property) => {
                  const originalIndex = properties.findIndex(p => p.id === property.id);
                  return (
                    <div
                      key={property.id}
                      className="flex items-center gap-3 sm:gap-4 p-2 sm:p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                      onClick={() => {
                        const element = document.getElementById(`property-${property.id}`);
                        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }}
                    >
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="px-2 py-0.5 bg-primary text-primary-foreground rounded text-xs font-bold">
                          #{originalIndex + 1}
                        </span>
                        <span className="flex items-center gap-1 text-xs sm:text-sm font-medium text-foreground min-w-[70px] sm:min-w-[80px]">
                          <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-muted-foreground" />
                          {formatShowingTime(property.showing_time)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm text-foreground truncate">
                          {property.address}
                        </p>
                      </div>
                      {property.price && (
                        <span className="text-xs sm:text-sm font-semibold text-foreground flex-shrink-0 hidden xs:block">
                          {formatPrice(property.price)}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Properties */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center justify-between sm:gap-4 mb-5 sm:mb-6">
          <h2 className="font-display text-lg sm:text-xl font-semibold text-foreground">
            Properties ({properties.length})
          </h2>
          <div className="flex items-center gap-2">
            {getFavoriteCount() > 0 && (
              <Button
                variant={showFavoritesOnly ? "default" : "outline"}
                size="sm"
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                className="gap-2 text-sm"
              >
                <Heart className={`w-4 h-4 ${showFavoritesOnly ? 'fill-current' : ''}`} />
                Favorites ({getFavoriteCount()})
              </Button>
            )}
            {properties.length >= 2 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCompareOpen(true)}
                className="gap-2 text-sm"
              >
                <Scale className="w-4 h-4" />
                Compare
              </Button>
            )}
          </div>
        </div>

        {properties.length > 0 ? (
          <div className="max-w-3xl mx-auto space-y-6 sm:space-y-8">
            {properties
              .filter(p => !showFavoritesOnly || isFavorite(p.id))
              .map((property, index) => (
              <div
                key={property.id}
                id={`property-${property.id}`}
                className="bg-card rounded-xl sm:rounded-2xl overflow-hidden card-elevated"
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
                      <Home className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground" />
                    </div>
                  )}
                  {/* Favorite button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(property.id);
                    }}
                    className="absolute top-3 right-3 w-10 h-10 sm:w-10 sm:h-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center transition-all hover:scale-110 active:scale-95 touch-target"
                    aria-label={isFavorite(property.id) ? "Remove from favorites" : "Add to favorites"}
                  >
                    <Heart 
                      className={`w-5 h-5 transition-colors ${
                        isFavorite(property.id) 
                          ? 'fill-red-500 text-red-500' 
                          : 'text-foreground/70'
                      }`} 
                    />
                  </button>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-5">
                  {/* Header row: Badge, Date, Price */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <span className="px-2.5 sm:px-3 py-1 bg-primary text-primary-foreground rounded-md text-xs sm:text-sm font-bold">
                        #{index + 1}
                      </span>
                      {property.showing_time && (
                        <span className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm text-muted-foreground">
                          <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          {formatShowingTime(property.showing_time)}
                        </span>
                      )}
                      {!property.showing_time && session.session_date && (() => {
                        const [year, month, day] = session.session_date.split('-').map(Number);
                        const localDate = new Date(year, month - 1, day);
                        return (
                          <span className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm text-muted-foreground">
                            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            {format(localDate, 'MMM d')}
                          </span>
                        );
                      })()}
                    </div>
                    {property.price && (
                      <span className="text-xl sm:text-2xl font-display font-bold text-foreground">
                        {formatPrice(property.price)}
                      </span>
                    )}
                  </div>

                  {/* Address */}
                  <div className="flex items-start gap-2 mb-3 sm:mb-4">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-display font-semibold text-foreground text-sm sm:text-base break-words">
                        {property.address}
                        {property.city && `, ${property.city}`}
                        {property.state && `, ${property.state}`}
                        {property.zip_code && ` ${property.zip_code}`}
                      </p>
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                          `${property.address}${property.city ? `, ${property.city}` : ''}${property.state ? `, ${property.state}` : ''}${property.zip_code ? ` ${property.zip_code}` : ''}`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs sm:text-sm text-primary hover:underline mt-1 touch-target"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Navigation className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        Get Directions
                      </a>
                    </div>
                  </div>

                  {/* Property Stats */}
                  {(property.beds || property.baths || property.sqft) && (
                    <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                      {property.beds && <span>{property.beds} Bd</span>}
                      {property.baths && <span>• {property.baths} Ba</span>}
                      {property.sqft && <span>• {property.sqft.toLocaleString()} Sq Ft</span>}
                    </div>
                  )}


                  {/* Documents */}
                  {property.documents && property.documents.length > 0 && (
                    <div className="mb-3 sm:mb-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-between h-10 sm:h-auto"
                        onClick={() => {
                          setDocsProperty(property);
                          setDocsOpen(true);
                        }}
                      >
                        <span className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span className="text-sm">Property Documents</span>
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {property.documents.length}
                        </span>
                      </Button>
                    </div>
                  )}

                  {/* My Photos section - read only */}
                  {property.client_photos && property.client_photos.length > 0 && (
                    <div className="mb-3 sm:mb-4">
                      <div className="flex items-center gap-2 text-muted-foreground mb-2 sm:mb-3">
                        <Image className="w-4 h-4" />
                        <span className="text-xs sm:text-sm">Photos ({property.client_photos.length})</span>
                      </div>
                      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
                        {property.client_photos.map((photo) => (
                          <div key={photo.id} className="relative flex-shrink-0">
                            <img
                              src={photo.file_url}
                              alt="Client photo"
                              className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover cursor-pointer touch-target"
                              onClick={() => window.open(photo.file_url, '_blank')}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 sm:gap-2 h-11 sm:h-10 text-xs sm:text-sm"
                      onClick={() => {
                        setDetailProperty(property);
                        setDetailOpen(true);
                        // Track property view
                        if (session) {
                          trackEvent({
                            eventType: 'property_view',
                            sessionId: session.id,
                            propertyId: property.id,
                            adminId: session.admin_id,
                            metadata: { address: property.address },
                          });
                        }
                      }}
                    >
                      <ExternalLink className="w-4 h-4" />
                      VIEW DETAILS
                    </Button>
                    <Button
                      size="sm"
                      className="gap-1.5 sm:gap-2 h-11 sm:h-10 bg-primary text-primary-foreground text-xs sm:text-sm"
                      onClick={() => handleOpenFeedback(property)}
                    >
                      <Star className="w-4 h-4" />
                      {ratings[property.id] ? 'EDIT RATING' : 'RATE HOME'}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 sm:py-16 bg-card rounded-xl">
            <Home className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
            <p className="text-muted-foreground text-sm sm:text-base">
              No properties have been added to this session yet.
            </p>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-muted py-4 sm:py-6 mt-6 sm:mt-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-xs sm:text-sm text-muted-foreground">
            Powered by{' '}
            <Link to="/" className="text-accent hover:underline">
              HomeFolio
            </Link>
          </p>
        </div>
      </footer>
      {/* Feedback Dialog */}
      {activeProperty && session && (
        <PropertyFeedbackDialog
          open={feedbackOpen}
          onOpenChange={setFeedbackOpen}
          propertyId={activeProperty.id}
          propertyAddress={activeProperty.address}
          sessionId={session.id}
          shareToken={token || ''}
          existingRating={ratings[activeProperty.id]?.rating || 5}
          existingFeedback={ratings[activeProperty.id]?.feedback}
          onSaved={handleFeedbackSaved}
        />
      )}

      <PropertyDocumentsDrawer
        open={docsOpen}
        onOpenChange={setDocsOpen}
        propertyAddress={docsProperty?.address || ''}
        documents={docsProperty?.documents || []}
        onOpen={handleViewDocument}
        onDownload={handleDownloadDocument}
      />

      <PublicPropertyDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        property={detailProperty}
        sessionDate={session.session_date}
        onOpenDocument={handleViewDocument}
        onDownloadDocument={handleDownloadDocument}
      />

      <PropertyCompareDialog
        open={compareOpen}
        onOpenChange={setCompareOpen}
        properties={properties}
        ratings={ratings}
      />
    </div>
  );
};

export default PublicSession;
