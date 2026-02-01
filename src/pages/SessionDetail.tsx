import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Home,
  Edit,
  Copy,
  QrCode,
  Trash2,
  Plus,
  FileText,
  ExternalLink,
  ChevronUp,
  ChevronDown,
  Route,
  Upload,
  Star,
  MessageSquare,
  Loader2,
  List,
  Map,
  Navigation,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import AddPropertyDialog from '@/components/showings/AddPropertyDialog';
import QRCodeDialog from '@/components/showings/QRCodeDialog';
import PropertyDocumentsDialog from '@/components/showings/PropertyDocumentsDialog';
import PropertyMap from '@/components/showings/PropertyMap';
import AdminLayout from '@/components/layout/AdminLayout';
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
}

const SessionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<ShowingSession | null>(null);
  const [properties, setProperties] = useState<SessionProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddPropertyOpen, setIsAddPropertyOpen] = useState(false);
  const [isQROpen, setIsQROpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [docsPropertyId, setDocsPropertyId] = useState<string | null>(null);
  const [docsPropertyAddress, setDocsPropertyAddress] = useState('');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [startingPoint, setStartingPoint] = useState('');

  useEffect(() => {
    if (id) {
      fetchSession();
      fetchProperties();
    }
  }, [id]);

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
        order_index: maxOrder + 1,
      });

      if (error) throw error;

      toast.success('Property added!');
      fetchProperties();
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

  const handleMoveProperty = async (propertyId: string, direction: 'up' | 'down') => {
    const currentIndex = properties.findIndex((p) => p.id === propertyId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= properties.length) return;

    const currentProperty = properties[currentIndex];
    const swapProperty = properties[newIndex];

    try {
      await Promise.all([
        supabase
          .from('session_properties')
          .update({ order_index: swapProperty.order_index })
          .eq('id', currentProperty.id),
        supabase
          .from('session_properties')
          .update({ order_index: currentProperty.order_index })
          .eq('id', swapProperty.id),
      ]);

      fetchProperties();
    } catch (error) {
      toast.error('Failed to reorder properties');
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
      fetchProperties();
    } catch (error) {
      toast.error('Failed to delete property');
    }
  };

  const handleCopyLink = () => {
    if (!session) return;
    const link = `${window.location.origin}/s/${session.share_token}`;
    navigator.clipboard.writeText(link);
    toast.success('Link copied to clipboard!');
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
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            <Button variant="outline" className="w-full justify-start gap-2">
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
                asChild
              >
                <a
                  href={getGoogleMapsUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Navigation className="w-4 h-4" />
                  Directions
                </a>
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
            {properties.map((property, index) => (
              <div
                key={property.id}
                className="bg-card rounded-xl p-4 card-elevated flex items-center gap-4"
              >
                {/* Reorder Buttons */}
                <div className="flex flex-col gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    disabled={index === 0}
                    onClick={() => handleMoveProperty(property.id, 'up')}
                  >
                    <ChevronUp className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    disabled={index === properties.length - 1}
                    onClick={() => handleMoveProperty(property.id, 'down')}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </div>

                {/* Photo */}
                <div className="w-20 h-14 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                  {property.photo_url ? (
                    <img
                      src={property.photo_url}
                      alt={property.address}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Home className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-muted text-muted-foreground text-xs font-medium rounded">
                      #{index + 1}
                    </span>
                    <h3 className="font-semibold text-foreground truncate">
                      {property.address}
                      {property.city && `, ${property.city}`}
                      {property.state && `, ${property.state}`}
                      {property.zip_code && ` ${property.zip_code}`}
                    </h3>
                    {property.rating && (
                      <div className="flex items-center gap-1 px-2 py-0.5 bg-accent/10 text-accent text-xs font-medium rounded">
                        <Star className="w-3 h-3 fill-current" />
                        {property.rating.rating}/10
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    {property.price && (
                      <span className="text-accent font-medium">
                        {formatPrice(property.price)}
                      </span>
                    )}
                    {(property.beds || property.baths || property.sqft) && (
                      <span className="text-muted-foreground text-sm">
                        {property.beds && `${property.beds} bed`}
                        {property.beds && property.baths && ' · '}
                        {property.baths && `${property.baths} bath`}
                        {(property.beds || property.baths) && property.sqft && ' · '}
                        {property.sqft && `${property.sqft.toLocaleString()} sqft`}
                      </span>
                    )}
                  </div>
                  {/* Client Feedback Summary */}
                  {property.rating?.feedback && Object.keys(property.rating.feedback).length > 0 && (
                    <div className="mt-2 p-2 bg-muted/50 rounded-lg text-sm space-y-1">
                      <div className="flex items-center gap-1 text-muted-foreground font-medium">
                        <MessageSquare className="w-3 h-3" />
                        Client Feedback
                      </div>
                      {property.rating.feedback.nextStep && (
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            property.rating.feedback.nextStep === 'interested' 
                              ? 'bg-green-500/20 text-green-700 dark:text-green-400'
                              : property.rating.feedback.nextStep === 'not_interested'
                              ? 'bg-red-500/20 text-red-700 dark:text-red-400'
                              : 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400'
                          }`}>
                            {property.rating.feedback.nextStep === 'interested' && '✓ Interested'}
                            {property.rating.feedback.nextStep === 'not_interested' && '✗ Not Interested'}
                            {property.rating.feedback.nextStep === 'revisit' && '↻ Wants to Revisit'}
                          </span>
                        </div>
                      )}
                      {property.rating.feedback.priceFeel && (
                        <p className="text-muted-foreground">
                          <span className="font-medium">Price:</span>{' '}
                          {property.rating.feedback.priceFeel === 'fair' && 'Fair'}
                          {property.rating.feedback.priceFeel === 'high' && 'Too High'}
                          {property.rating.feedback.priceFeel === 'low' && 'Great Value'}
                        </p>
                      )}
                      {property.rating.feedback.topThingsLiked && (
                        <p className="text-muted-foreground truncate">
                          <span className="font-medium">Liked:</span> {property.rating.feedback.topThingsLiked}
                        </p>
                      )}
                      {property.rating.feedback.concerns && (
                        <p className="text-muted-foreground truncate">
                          <span className="font-medium">Concerns:</span> {property.rating.feedback.concerns}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={() => {
                      setDocsPropertyId(property.id);
                      setDocsPropertyAddress(
                        `${property.address}${property.city ? `, ${property.city}` : ''}${property.state ? `, ${property.state}` : ''}`
                      );
                    }}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Docs{property.doc_count ? ` (${property.doc_count})` : ''}
                  </Button>
                  <Button variant="ghost" size="icon">
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDeleteProperty(property.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
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
      </div>

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
    </AdminLayout>
  );
};

export default SessionDetail;
