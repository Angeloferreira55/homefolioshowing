import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  ArrowLeft,
  Home,
  Edit,
  Copy,
  QrCode,
  Trash2,
  Plus,
  ExternalLink,
  Route,
  ChevronDown,
  Upload,
  Loader2,
  Share2,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import AddPropertyDialog from '@/components/showings/AddPropertyDialog';
import BulkMLSImportDialog from '@/components/showings/BulkMLSImportDialog';
import EditSessionDialog from '@/components/showings/EditSessionDialog';
import EditPropertyDetailsDialog from '@/components/showings/EditPropertyDetailsDialog';
import QRCodeDialog from '@/components/showings/QRCodeDialog';
import PropertyDocumentsDialog from '@/components/showings/PropertyDocumentsDialog';

import AdminLayout from '@/components/layout/AdminLayout';
import SessionDetailSkeleton from '@/components/skeletons/SessionDetailSkeleton';
import { SortablePropertyCard } from '@/components/showings/SortablePropertyCard';
import { BulkActionsBar } from '@/components/showings/BulkActionsBar';
import { trackEvent } from '@/hooks/useAnalytics';
import { sendNotificationEmail } from '@/hooks/useNotifications';
import { getPublicShareOrigin } from '@/lib/publicShareOrigin';
import { Card } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Label } from '@/components/ui/label';

interface FeedbackData {
  topThingsLiked?: string;
  concerns?: string;
  lifestyleFit?: string;
  layoutThoughts?: string;
  priceFeel?: string;
  neighborhoodThoughts?: string;
  conditionConcerns?: string;
  nextStep?: string;
  investigateRequest?: string;
}

interface PropertyRating {
  rating: number | null;
  feedback: FeedbackData;
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
  beds: number | null;
  baths: number | null;
  sqft: number | null;
  doc_count?: number;
  rating?: PropertyRating;
  showing_time?: string | null;
}

interface ShowingSession {
  id: string;
  title: string;
  client_name: string;
  session_date: string | null;
  share_token: string;
  notes: string | null;
  share_password: string | null;
}

const SessionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<ShowingSession | null>(null);
  const [properties, setProperties] = useState<SessionProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddPropertyOpen, setIsAddPropertyOpen] = useState(false);
  const [isQROpen, setIsQROpen] = useState(false);
  const [isEditSessionOpen, setIsEditSessionOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [docsPropertyId, setDocsPropertyId] = useState<string | null>(null);
  const [docsPropertyAddress, setDocsPropertyAddress] = useState('');
  const [isOptimizing, setIsOptimizing] = useState(false);
const [startingAddress, setStartingAddress] = useState({ street: '', city: '', state: '', zip: '' });
const [endingAddress, setEndingAddress] = useState({ street: '', city: '', state: '', zip: '' });
  const [brokerageLogo, setBrokerageLogo] = useState<string | null>(null);
  const [editDetailsPropertyId, setEditDetailsPropertyId] = useState<string | null>(null);
  const [legDurations, setLegDurations] = useState<Array<{ from: string; to: string; seconds: number }>>([]);
  const [routeCoordinates, setRouteCoordinates] = useState<Array<{ id: string; lat: number; lng: number }>>([]);
  const [editDetailsPropertyAddress, setEditDetailsPropertyAddress] = useState('');
  const [selectedProperties, setSelectedProperties] = useState<Set<string>>(new Set());
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [isRoutePopoverOpen, setIsRoutePopoverOpen] = useState(false);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (id) {
      fetchSession();
      fetchProperties();
      fetchAgentLogo();
    }
  }, [id]);

  const fetchAgentLogo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('profiles')
        .select('brokerage_logo_url')
        .eq('user_id', user.id)
        .single();

      if (data?.brokerage_logo_url) {
        setBrokerageLogo(data.brokerage_logo_url);
      }
    } catch (error) {
      console.log('Could not fetch agent logo');
    }
  };

  const fetchSession = async (retryCount = 0) => {
    try {
      // First ensure we have a valid auth session
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.log('Auth error, redirecting to login');
        navigate('/auth');
        return;
      }

      const { data, error } = await supabase
        .from('showing_sessions')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      
      if (!data) {
        // Session not found - could be timing issue on mobile, retry once
        if (retryCount < 2) {
          console.log(`Session not found, retrying (attempt ${retryCount + 1})...`);
          await new Promise(resolve => setTimeout(resolve, 500));
          return fetchSession(retryCount + 1);
        }
        toast.error('Session not found');
        navigate('/admin/showings');
        return;
      }
      
      setSession(data);
    } catch (error: any) {
      console.error('Fetch session error:', error);
      // Retry on network errors
      if (retryCount < 2 && (error.message?.includes('network') || error.code === 'PGRST301')) {
        await new Promise(resolve => setTimeout(resolve, 500));
        return fetchSession(retryCount + 1);
      }
      toast.error('Failed to load session');
      navigate('/admin/showings');
    } finally {
      setLoading(false);
    }
  };

  const fetchProperties = async () => {
    try {
      const { data: propertiesData, error } = await supabase
        .from('session_properties')
        .select('*')
        .eq('session_id', id)
        .order('order_index', { ascending: true });

      if (error) throw error;

      // Get doc counts and ratings for each property
      const propsWithExtras = await Promise.all(
        (propertiesData || []).map(async (prop) => {
          const [docResult, ratingResult] = await Promise.all([
            supabase
              .from('property_documents')
              .select('*', { count: 'exact', head: true })
              .eq('session_property_id', prop.id),
            supabase
              .from('property_ratings')
              .select('rating, feedback')
              .eq('session_property_id', prop.id)
              .maybeSingle()
          ]);

          let rating: PropertyRating | undefined;
          if (ratingResult.data) {
            let parsedFeedback: FeedbackData = {};
            if (ratingResult.data.feedback) {
              try {
                parsedFeedback = JSON.parse(ratingResult.data.feedback);
              } catch {
                parsedFeedback = {};
              }
            }
            rating = {
              rating: ratingResult.data.rating,
              feedback: parsedFeedback
            };
          }

          return { 
            ...prop, 
            doc_count: docResult.count || 0,
            rating
          };
        })
      );

      setProperties(propsWithExtras);
    } catch (error) {
      toast.error('Failed to load properties');
    }
  };

  const handleAddProperty = async (data: {
    address: string;
    city?: string;
    state?: string;
    zipCode?: string;
    price?: number;
    photoUrl?: string;
    beds?: number;
    baths?: number;
    sqft?: number;
    description?: string;
    summary?: string;
    yearBuilt?: number;
    lotSize?: string;
    propertyType?: string;
    hoaFee?: number;
    garage?: string;
    heating?: string;
    cooling?: string;
    features?: string[];
  }) => {
    try {
      // Verify user is authenticated before insert
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please sign in to add properties');
        navigate('/auth');
        return;
      }

      const maxOrder = properties.reduce((max, p) => Math.max(max, p.order_index), -1);
      
      const { error } = await supabase.from('session_properties').insert({
        session_id: id,
        address: data.address,
        city: data.city || null,
        state: data.state || null,
        zip_code: data.zipCode || null,
        price: data.price || null,
        photo_url: data.photoUrl || null,
        beds: data.beds || null,
        baths: data.baths || null,
        sqft: data.sqft || null,
        description: data.description || null,
        summary: data.summary || null,
        year_built: data.yearBuilt || null,
        lot_size: data.lotSize || null,
        property_type: data.propertyType || null,
        hoa_fee: data.hoaFee || null,
        garage: data.garage || null,
        heating: data.heating || null,
        cooling: data.cooling || null,
        features: data.features || null,
        order_index: maxOrder + 1,
      });

      if (error) throw error;

      toast.success('Property added!');
      fetchProperties();

      // Send email notification (fire and forget)
      sendNotificationEmail({
        type: 'property_added',
        sessionId: id!,
        propertyAddress: data.address,
      });
    } catch (error: any) {
      console.error('Add property error:', error);
      toast.error(error.message || 'Failed to add property');
    }
  };

  const handleAddMultipleProperties = async (propertiesData: Array<{
    address: string;
    city?: string;
    state?: string;
    zipCode?: string;
    price?: number;
    photoUrl?: string;
    beds?: number;
    baths?: number;
    sqft?: number;
    description?: string;
    summary?: string;
    yearBuilt?: number;
    lotSize?: string;
    propertyType?: string;
    hoaFee?: number;
    garage?: string;
    heating?: string;
    cooling?: string;
    features?: string[];
  }>) => {
    try {
      // Verify user is authenticated before insert
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please sign in to add properties');
        navigate('/auth');
        return;
      }

      const maxOrder = properties.reduce((max, p) => Math.max(max, p.order_index), -1);
      
      const insertData = propertiesData.map((data, index) => ({
        session_id: id,
        address: data.address,
        city: data.city || null,
        state: data.state || null,
        zip_code: data.zipCode || null,
        price: data.price || null,
        photo_url: data.photoUrl || null,
        beds: data.beds || null,
        baths: data.baths || null,
        sqft: data.sqft || null,
        description: data.description || null,
        summary: data.summary || null,
        year_built: data.yearBuilt || null,
        lot_size: data.lotSize || null,
        property_type: data.propertyType || null,
        hoa_fee: data.hoaFee || null,
        garage: data.garage || null,
        heating: data.heating || null,
        cooling: data.cooling || null,
        features: data.features || null,
        order_index: maxOrder + 1 + index,
      }));

      const { error } = await supabase.from('session_properties').insert(insertData);

      if (error) throw error;

      toast.success(`${propertiesData.length} properties added!`);
      fetchProperties();
    } catch (error: any) {
      console.error('Add multiple properties error:', error);
      toast.error(error.message || 'Failed to add properties');
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = properties.findIndex((p) => p.id === active.id);
      const newIndex = properties.findIndex((p) => p.id === over.id);

      // Optimistic update
      const newProperties = arrayMove(properties, oldIndex, newIndex);
      setProperties(newProperties);

      try {
        // Update order_index for all affected properties
        const updates = newProperties.map((prop, idx) =>
          supabase
            .from('session_properties')
            .update({ order_index: idx })
            .eq('id', prop.id)
        );

        await Promise.all(updates);
      } catch (error) {
        toast.error('Failed to reorder properties');
        fetchProperties(); // Revert on error
      }
    }
  };

  const handleDeleteProperty = async (propertyId: string) => {
    try {
      const { error } = await supabase
        .from('session_properties')
        .delete()
        .eq('id', propertyId);

      if (error) throw error;

      toast.success('Property removed');
      setSelectedProperties((prev) => {
        const next = new Set(prev);
        next.delete(propertyId);
        return next;
      });
      fetchProperties();
    } catch (error) {
      toast.error('Failed to delete property');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProperties.size === 0) return;

    try {
      const { error } = await supabase
        .from('session_properties')
        .delete()
        .in('id', Array.from(selectedProperties));

      if (error) throw error;

      toast.success(`${selectedProperties.size} properties removed`);
      setSelectedProperties(new Set());
      fetchProperties();
    } catch (error) {
      toast.error('Failed to delete properties');
    }
  };

  const handleSelectProperty = (id: string, selected: boolean) => {
    setSelectedProperties((prev) => {
      const next = new Set(prev);
      if (selected) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedProperties(new Set(properties.map((p) => p.id)));
  };

  const handleClearSelection = () => {
    setSelectedProperties(new Set());
  };

  const handleCopyLink = async () => {
    if (!session) return;
    const link = `${window.location.origin}/s/${session.share_token}`;
    navigator.clipboard.writeText(link);
    toast.success('Link copied to clipboard!');
    
    // Track session share
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      trackEvent({
        eventType: 'session_share',
        sessionId: session.id,
        adminId: user.id,
        metadata: { client_name: session.client_name },
      });

      // Send email notification (fire and forget)
      sendNotificationEmail({
        type: 'session_shared',
        sessionId: session.id,
        shareLink: link,
      });
    }
  };

  const handleShareLink = async () => {
    if (!session) return;
    const publicOrigin = getPublicShareOrigin();
    const link = `${publicOrigin}/s/${session.share_token}`;
    const shareData = {
      title: session.title,
      text: `View ${session.client_name}'s property tour`,
      url: link,
    };

    if (navigator.share && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        // Track share event
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          trackEvent({
            eventType: 'session_share',
            sessionId: session.id,
            adminId: user.id,
            metadata: { client_name: session.client_name, method: 'native_share' },
          });
        }
      } catch (err) {
        // User cancelled or share failed - fall back to copy
        if ((err as Error).name !== 'AbortError') {
          navigator.clipboard.writeText(link);
          toast.success('Link copied to clipboard!');
        }
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(link);
      toast.success('Link copied to clipboard!');
    }
  };

  const handleDeleteSession = async () => {
    try {
      const { error } = await supabase
        .from('showing_sessions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Session deleted');
      navigate('/admin/showings');
    } catch (error) {
      toast.error('Failed to delete session');
    }
  };

  // Helper to format date as YYYY-MM-DD without timezone shift
  const formatDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleEditSession = async (data: {
    title: string;
    clientName: string;
    sessionDate?: Date;
    notes?: string;
    accessCode?: string | null;
  }) => {
    try {
      const { error } = await supabase
        .from('showing_sessions')
        .update({
          title: data.title,
          client_name: data.clientName,
          session_date: data.sessionDate ? formatDateString(data.sessionDate) : null,
          notes: data.notes || null,
          share_password: data.accessCode,
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('Session updated');
      fetchSession();
    } catch (error) {
      toast.error('Failed to update session');
    }
  };

  const getGoogleMapsUrl = () => {
    if (properties.length === 0) return '#';
    
    // Build full addresses for each property in order
    const addresses = properties.map(p => {
      return [p.address, p.city, p.state, p.zip_code]
        .filter(Boolean)
        .join(', ');
    });
    
    // Google Maps directions URL format:
    // https://www.google.com/maps/dir/origin/waypoint1/waypoint2/.../destination
    const encodedAddresses = addresses.map(addr => encodeURIComponent(addr));
    
    // If there's a starting point, use it as origin
    const startingPointStr = [startingAddress.street, startingAddress.city, startingAddress.state, startingAddress.zip].filter(Boolean).join(', ');
    if (startingPointStr) {
      const origin = encodeURIComponent(startingPointStr);
      // All properties become waypoints, last one is destination
      if (encodedAddresses.length === 1) {
        return `https://www.google.com/maps/dir/${origin}/${encodedAddresses[0]}`;
      }
      const waypoints = encodedAddresses.slice(0, -1).join('/');
      const destination = encodedAddresses[encodedAddresses.length - 1];
      return `https://www.google.com/maps/dir/${origin}/${waypoints}/${destination}`;
    }
    
    // No starting point: first property is origin, rest are waypoints/destination
    if (encodedAddresses.length === 1) {
      return `https://www.google.com/maps/search/${encodedAddresses[0]}`;
    }
    
    return `https://www.google.com/maps/dir/${encodedAddresses.join('/')}`;
  };

  const formatPrice = (price: number | null) => {
    if (!price) return null;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const handleOptimizeRoute = async () => {
    if (properties.length < 2) {
      toast.info('Need at least 2 properties to optimize route');
      return;
    }

    setIsOptimizing(true);
    try {
      const { data, error } = await supabase.functions.invoke('optimize-route', {
        body: {
          properties: properties.map(p => ({
            id: p.id,
            address: p.address,
            city: p.city,
            state: p.state,
            zip_code: p.zip_code,
          })),
          startingPoint: [startingAddress.street, startingAddress.city, startingAddress.state, startingAddress.zip].filter(Boolean).join(', ') || undefined,
          endingPoint: [endingAddress.street, endingAddress.city, endingAddress.state, endingAddress.zip].filter(Boolean).join(', ') || undefined,
        },
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      const optimizedOrder: string[] = data.optimizedOrder;
      const totalSeconds: number = data.totalSeconds || 0;
      const totalMinutes = Math.round(totalSeconds / 60);
      const totalHours = Math.floor(totalSeconds / 3600);
      const remainingMinutes = Math.round((totalSeconds % 3600) / 60);
      const timeStr = totalHours > 0 ? `${totalHours}h ${remainingMinutes}m` : `${totalMinutes}m`;
      const routeLegDurations = data.legDurations || [];
      const routeCoords = data.routeCoordinates || [];
      setLegDurations(routeLegDurations);
      setRouteCoordinates(routeCoords);
      setIsRoutePopoverOpen(false); // Close popover after success
      toast.success(`Route optimized! Total drive time: ${timeStr}`);
      const updates = optimizedOrder.map((propId, newIndex) => 
        supabase
          .from('session_properties')
          .update({ order_index: newIndex })
          .eq('id', propId)
      );

      await Promise.all(updates);
      
      toast.success('Route optimized for efficient driving!');
      fetchProperties();
    } catch (error: any) {
      console.error('Route optimization error:', error);
      toast.error(error.message || 'Failed to optimize route');
    } finally {
      setIsOptimizing(false);
      setStartingAddress({ street: '', city: '', state: '', zip: '' });
      setEndingAddress({ street: '', city: '', state: '', zip: '' });
    }
  };

  if (loading) {
    return <SessionDetailSkeleton />;
  }

  if (!session) {
    return null;
  }

  return (
    <AdminLayout>
      <>
        {/* Back Link */}
        <Link
          to="/admin/showings"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 sm:mb-6 touch-target"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm sm:text-base">Back to Sessions</span>
        </Link>

        {/* Session Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="font-display text-xl sm:text-2xl lg:text-3xl font-bold text-foreground mb-1 sm:mb-2 break-words">
            {session.title}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">{session.client_name}</p>
          {session.session_date && (() => {
            // Parse date string as local date to avoid timezone shift
            const [year, month, day] = session.session_date.split('-').map(Number);
            const localDate = new Date(year, month - 1, day);
            return (
              <p className="text-sm sm:text-base text-muted-foreground flex items-center gap-2 mt-1">
                📅 {format(localDate, 'MMM d, yyyy')}
                <span className="hidden sm:inline">
                  ({format(localDate, 'EEEE')})
                </span>
              </p>
            );
          })()}
          
          {/* Actions - Horizontal on mobile, inline buttons */}
          <div className="flex flex-wrap gap-2 mt-4">
            <Button 
              variant="outline" 
              size="sm"
              className="gap-1.5 h-9 text-xs sm:text-sm"
              onClick={() => setIsEditSessionOpen(true)}
            >
              <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 h-9 text-xs sm:text-sm"
              onClick={handleCopyLink}
            >
              <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Copy Link
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 h-9 text-xs sm:text-sm"
              onClick={handleShareLink}
            >
              <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Share
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 h-9 text-xs sm:text-sm"
              onClick={() => setIsQROpen(true)}
            >
              <QrCode className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              QR Code
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="gap-1.5 h-9 text-xs sm:text-sm"
              onClick={() => setIsDeleteOpen(true)}
            >
              <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Delete
            </Button>
          </div>
        </div>

        {/* Properties Section */}
        <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg sm:text-xl font-semibold text-foreground">
              Properties ({properties.length})
            </h2>
            <Button
              variant="accent"
              size="sm"
              className="gap-1.5 h-9 text-xs sm:text-sm"
              onClick={() => setIsAddPropertyOpen(true)}
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Add Property
            </Button>
          </div>
          
          {/* Secondary actions row */}
          <div className="flex flex-wrap gap-2">
            <Popover open={isRoutePopoverOpen} onOpenChange={setIsRoutePopoverOpen}>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="gap-1.5 h-9 text-xs sm:text-sm"
                  disabled={isOptimizing || properties.length < 2}
                >
                  {isOptimizing ? (
                    <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                  ) : (
                    <Route className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  )}
                  <span className="hidden sm:inline">{isOptimizing ? 'Optimizing...' : 'Optimize Route'}</span>
                  <span className="sm:hidden">{isOptimizing ? '...' : 'Route'}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[calc(100vw-2rem)] sm:w-80" align="end">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-foreground text-sm sm:text-base">Route Optimization</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Reorder properties for the most efficient driving route.
                    </p>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs sm:text-sm font-medium">Starting Location (optional)</Label>
                      <div className="grid grid-cols-1 gap-2 mt-1.5">
                        <Input
                          placeholder="Street address"
                          value={startingAddress.street}
                          onChange={(e) => setStartingAddress(prev => ({ ...prev, street: e.target.value }))}
                          className="text-sm"
                        />
                        <div className="grid grid-cols-3 gap-2">
                          <Input
                            placeholder="City"
                            value={startingAddress.city}
                            onChange={(e) => setStartingAddress(prev => ({ ...prev, city: e.target.value }))}
                            className="text-sm"
                          />
                          <Input
                            placeholder="State"
                            value={startingAddress.state}
                            onChange={(e) => setStartingAddress(prev => ({ ...prev, state: e.target.value }))}
                            className="text-sm"
                          />
                          <Input
                            placeholder="Zip"
                            value={startingAddress.zip}
                            onChange={(e) => setStartingAddress(prev => ({ ...prev, zip: e.target.value }))}
                            className="text-sm"
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs sm:text-sm font-medium">Ending Location (optional)</Label>
                      <div className="grid grid-cols-1 gap-2 mt-1.5">
                        <Input
                          placeholder="Street address"
                          value={endingAddress.street}
                          onChange={(e) => setEndingAddress(prev => ({ ...prev, street: e.target.value }))}
                          className="text-sm"
                        />
                        <div className="grid grid-cols-3 gap-2">
                          <Input
                            placeholder="City"
                            value={endingAddress.city}
                            onChange={(e) => setEndingAddress(prev => ({ ...prev, city: e.target.value }))}
                            className="text-sm"
                          />
                          <Input
                            placeholder="State"
                            value={endingAddress.state}
                            onChange={(e) => setEndingAddress(prev => ({ ...prev, state: e.target.value }))}
                            className="text-sm"
                          />
                          <Input
                            placeholder="Zip"
                            value={endingAddress.zip}
                            onChange={(e) => setEndingAddress(prev => ({ ...prev, zip: e.target.value }))}
                            className="text-sm"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1.5">
                        Leave empty for round-trip back to start.
                      </p>
                    </div>
                  </div>
                  <Button 
                    className="w-full gap-2 h-10" 
                    onClick={handleOptimizeRoute}
                    disabled={isOptimizing}
                  >
                    {isOptimizing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Optimizing...
                      </>
                    ) : (
                      <>
                        <Route className="w-4 h-4" />
                        Optimize Now
                      </>
                    )}
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
            <Button 
              variant="outline" 
              size="sm"
              className="gap-1.5 h-9 text-xs sm:text-sm"
              onClick={() => setIsBulkImportOpen(true)}
            >
              <Upload className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Bulk Import</span>
              <span className="sm:hidden">Import</span>
            </Button>
          </div>
        </div>

        {/* Properties List */}
        {properties.length > 0 ? (
          <div className="space-y-3 sm:space-y-4">
            {/* Bulk Actions Bar */}
            <BulkActionsBar
              selectedCount={selectedProperties.size}
              onClear={handleClearSelection}
              onSelectAll={handleSelectAll}
              onDelete={handleBulkDelete}
              totalCount={properties.length}
            />

            {/* Drag and Drop List */}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={properties.map((p) => p.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3 sm:space-y-4">
                  {properties.map((property, index) => (
                    <SortablePropertyCard
                      key={property.id}
                      property={property}
                      index={index}
                      isSelected={selectedProperties.has(property.id)}
                      onSelect={handleSelectProperty}
                      onEditNotes={(prop) => {
                        setEditDetailsPropertyId(prop.id);
                        setEditDetailsPropertyAddress(
                          `${prop.address}${prop.city ? `, ${prop.city}` : ''}${prop.state ? `, ${prop.state}` : ''}`
                        );
                      }}
                      onManageDocs={(prop) => {
                        setDocsPropertyId(prop.id);
                        setDocsPropertyAddress(
                          `${prop.address}${prop.city ? `, ${prop.city}` : ''}${prop.state ? `, ${prop.state}` : ''}`
                        );
                      }}
                      onDelete={handleDeleteProperty}
                      onPhotoUpdated={fetchProperties}
                      onTimeUpdated={fetchProperties}
                      formatPrice={formatPrice}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        ) : (
          <div className="text-center py-16 bg-card rounded-xl">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <Home className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-display text-xl font-semibold text-foreground mb-2">
              No properties yet
            </h3>
            <p className="text-muted-foreground mb-6">
              Add properties to this showing session
            </p>
            <Button
              variant="accent"
              onClick={() => setIsAddPropertyOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add First Property
            </Button>
          </div>
        )}
      </>

      <AddPropertyDialog
        open={isAddPropertyOpen}
        onOpenChange={setIsAddPropertyOpen}
        onAdd={handleAddProperty}
        onAddMultiple={handleAddMultipleProperties}
      />

      <QRCodeDialog
        open={isQROpen}
        onOpenChange={setIsQROpen}
        shareToken={session.share_token}
        sessionTitle={session.title}
        logoUrl={brokerageLogo}
        accessCode={session.share_password}
      />

      <EditSessionDialog
        session={session}
        open={isEditSessionOpen}
        onOpenChange={setIsEditSessionOpen}
        onSave={handleEditSession}
      />

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Session?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this showing session and all its properties.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSession}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <PropertyDocumentsDialog
        open={!!docsPropertyId}
        onOpenChange={(open) => {
          if (!open) {
            setDocsPropertyId(null);
            fetchProperties(); // Refresh doc counts
          }
        }}
        propertyId={docsPropertyId || ''}
        propertyAddress={docsPropertyAddress}
      />

      <EditPropertyDetailsDialog
        open={!!editDetailsPropertyId}
        onOpenChange={(open) => {
          if (!open) {
            setEditDetailsPropertyId(null);
          }
        }}
        propertyId={editDetailsPropertyId || ''}
        propertyAddress={editDetailsPropertyAddress}
        onSaved={fetchProperties}
      />

      <BulkMLSImportDialog
        open={isBulkImportOpen}
        onOpenChange={setIsBulkImportOpen}
        onImport={handleAddMultipleProperties}
      />
    </AdminLayout>
  );
};

export default SessionDetail;
