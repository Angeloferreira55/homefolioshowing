import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Upload,
  Loader2,
  List,
  Map,
  Navigation,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import AddPropertyDialog from '@/components/showings/AddPropertyDialog';
import EditSessionDialog from '@/components/showings/EditSessionDialog';
import EditPropertyDetailsDialog from '@/components/showings/EditPropertyDetailsDialog';
import QRCodeDialog from '@/components/showings/QRCodeDialog';
import PropertyDocumentsDialog from '@/components/showings/PropertyDocumentsDialog';
import PropertyMap from '@/components/showings/PropertyMap';
import AdminLayout from '@/components/layout/AdminLayout';
import SessionDetailSkeleton from '@/components/skeletons/SessionDetailSkeleton';
import { SortablePropertyCard } from '@/components/showings/SortablePropertyCard';
import { BulkActionsBar } from '@/components/showings/BulkActionsBar';
import { trackEvent } from '@/hooks/useAnalytics';
import { sendNotificationEmail } from '@/hooks/useNotifications';
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
  const [startingPoint, setStartingPoint] = useState('');
  const [brokerageLogo, setBrokerageLogo] = useState<string | null>(null);
  const [editDetailsPropertyId, setEditDetailsPropertyId] = useState<string | null>(null);
  const [editDetailsPropertyAddress, setEditDetailsPropertyAddress] = useState('');
  const [selectedProperties, setSelectedProperties] = useState<Set<string>>(new Set());

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

  const fetchSession = async () => {
    try {
      const { data, error } = await supabase
        .from('showing_sessions')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setSession(data);
    } catch (error) {
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
          session_date: data.sessionDate?.toISOString().split('T')[0] || null,
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
    if (startingPoint.trim()) {
      const origin = encodeURIComponent(startingPoint.trim());
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
          startingPoint: startingPoint.trim() || undefined,
        },
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      const optimizedOrder: string[] = data.optimizedOrder;
      
      // Update order_index for each property based on optimized order
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
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Sessions
        </Link>

        {/* Session Header */}
        <div className="grid lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2">
            <h1 className="font-display text-3xl font-bold text-foreground mb-2">
              {session.title}
            </h1>
            <p className="text-muted-foreground">{session.client_name}</p>
            {session.session_date && (
              <p className="text-muted-foreground flex items-center gap-2 mt-1">
                📅 {format(new Date(session.session_date), 'EEEE, MMMM d, yyyy')}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start gap-2"
              onClick={() => setIsEditSessionOpen(true)}
            >
              <Edit className="w-4 h-4" />
              Edit
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={handleCopyLink}
            >
              <Copy className="w-4 h-4" />
              Copy Link
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => setIsQROpen(true)}
            >
              <QrCode className="w-4 h-4" />
              QR Code
            </Button>
            <Button
              variant="destructive"
              className="w-full justify-start gap-2"
              onClick={() => setIsDeleteOpen(true)}
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </Button>
          </div>
        </div>

        {/* Properties Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h2 className="font-display text-xl font-semibold text-foreground">
            Properties ({properties.length})
          </h2>
          <div className="flex gap-3">
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  className="gap-2"
                  disabled={isOptimizing || properties.length < 2}
                >
                  {isOptimizing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Route className="w-4 h-4" />
                  )}
                  {isOptimizing ? 'Optimizing...' : 'Optimize Route'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-foreground">Route Optimization</h4>
                    <p className="text-sm text-muted-foreground">
                      Reorder properties for the most efficient driving route.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="startingPoint">Starting Location (optional)</Label>
                    <Input
                      id="startingPoint"
                      placeholder="e.g., 123 Main St, City, State"
                      value={startingPoint}
                      onChange={(e) => setStartingPoint(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Leave empty to optimize based on property locations only.
                    </p>
                  </div>
                  <Button 
                    className="w-full gap-2" 
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
            {properties.length >= 1 && (
              <Button 
                variant="outline" 
                className="gap-2"
                onClick={() => {
                  const url = getGoogleMapsUrl();
                  if (url !== '#') {
                    window.open(url, '_blank', 'noopener,noreferrer');
                  }
                }}
              >
                <Navigation className="w-4 h-4" />
                Directions
              </Button>
            )}
            <Button variant="outline" className="gap-2">
              <Upload className="w-4 h-4" />
              Bulk Import
            </Button>
            <Button
              variant="accent"
              className="gap-2"
              onClick={() => setIsAddPropertyOpen(true)}
            >
              <Plus className="w-4 h-4" />
              Add Property
            </Button>
          </div>
        </div>

        {/* Properties List/Map Tabs */}
        {properties.length > 0 ? (
          <Tabs defaultValue="list" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="list" className="gap-2">
                <List className="w-4 h-4" />
                List View
              </TabsTrigger>
              <TabsTrigger value="map" className="gap-2">
                <Map className="w-4 h-4" />
                Map View
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="list" className="space-y-4">
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
                  <div className="space-y-4">
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
                        formatPrice={formatPrice}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </TabsContent>
            
            <TabsContent value="map">
              <PropertyMap properties={properties} />
            </TabsContent>
          </Tabs>
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
    </AdminLayout>
  );
};

export default SessionDetail;
