import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { retryOperation, getErrorMessage, ERROR_MESSAGES, logError } from '@/lib/errorHandling';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  rectSortingStrategy,
  useSortable,
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
  LayoutGrid,
  List,
  Star,
  Clock,
  Pencil,
  FileText,
  ImagePlus,
  CheckCircle2,
  ClipboardList,
  Undo2,
  Archive,
  RotateCcw,
  MapPin,
  Car,
  Timer,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import AddPropertyDialog from '@/components/showings/AddPropertyDialog';
import AddAddressDialog from '@/components/showings/AddAddressDialog';
import BulkMLSImportDialog from '@/components/showings/BulkMLSImportDialog';
import EditSessionDialog from '@/components/showings/EditSessionDialog';
import EditPropertyDetailsDialog from '@/components/showings/EditPropertyDetailsDialog';
import QRCodeDialog from '@/components/showings/QRCodeDialog';
import PropertyDocumentsDialog from '@/components/showings/PropertyDocumentsDialog';

import AdminLayout from '@/components/layout/AdminLayout';
import SessionDetailSkeleton from '@/components/skeletons/SessionDetailSkeleton';
import { SortablePropertyCard } from '@/components/showings/SortablePropertyCard';
import { BulkActionsBar } from '@/components/showings/BulkActionsBar';
import { MoveToSessionDialog } from '@/components/showings/MoveToSessionDialog';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

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
  agent_notes?: string | null;
  recipient_name?: string | null;
  delivery_completed_at?: string | null;
  delivery_notes?: string | null;
  delivery_photo_url?: string | null;
}

interface ShowingSession {
  id: string;
  title: string;
  client_name: string;
  session_date: string | null;
  share_token: string;
  notes: string | null;
  share_password: string | null;
  session_type: string | null;
}

// Sortable Gallery Card Component
interface SortableGalleryCardProps {
  property: SessionProperty;
  index: number;
  onEditTime: (id: string, time: string) => void;
  onSaveTime: (id: string) => void;
  onCancelEditTime: () => void;
  onEditDetails: (id: string, address: string) => void;
  onManageDocs: (id: string, address: string) => void;
  onDelete: (id: string) => void;
  editingTimeId: string | null;
  timeValue: string;
  setTimeValue: (value: string) => void;
  formatDisplayTime: (time: string | null | undefined) => string | null;
  formatPrice: (price: number | null) => string | null;
  drivingMinutes: number | null;
  drivingFromStart: number | null;
  onPhotoUploaded?: () => void;
  isPopBy?: boolean;
  showingDuration?: number;
  onShowingDurationChange?: (id: string, minutes: number) => void;
}

const SortableGalleryCard = ({
  property,
  index,
  onEditTime,
  onSaveTime,
  onCancelEditTime,
  onEditDetails,
  onManageDocs,
  onDelete,
  editingTimeId,
  timeValue,
  setTimeValue,
  formatDisplayTime,
  formatPrice,
  drivingMinutes,
  drivingFromStart,
  onPhotoUploaded,
  isPopBy = false,
  showingDuration = 30,
  onShowingDurationChange,
}: SortableGalleryCardProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [localPhotoUrl, setLocalPhotoUrl] = useState<string | null>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: property.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  const displayPhotoUrl = localPhotoUrl || property.photo_url;

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${property.id}-${Date.now()}.${fileExt}`;
      const filePath = `${property.id}/${fileName}`;
      const { error: uploadError } = await supabase.storage
        .from('client-photos')
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage
        .from('client-photos')
        .getPublicUrl(filePath);
      const { error: updateError } = await supabase
        .from('session_properties')
        .update({ photo_url: publicUrl })
        .eq('id', property.id);
      if (updateError) throw updateError;
      setLocalPhotoUrl(publicUrl);
      toast.success('Photo uploaded!');
      onPhotoUploaded?.();
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      toast.error(error.message || 'Failed to upload photo');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div ref={setNodeRef} style={style}>
      {/* Driving time from start indicator */}
      {drivingFromStart !== null && index === 0 && (
        <div className="mb-3 flex items-center justify-center">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 rounded-full text-sm font-medium">
            <Route className="w-4 h-4" />
            <span>{drivingFromStart} min from starting point</span>
          </div>
        </div>
      )}

      {/* Driving time from previous property */}
      {drivingMinutes !== null && index > 0 && (
        <div className="mb-3 flex items-center justify-center">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
            <Route className="w-4 h-4" />
            <span>{drivingMinutes} min drive</span>
          </div>
        </div>
      )}

      <div
        {...attributes}
        {...listeners}
        className="bg-card rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing"
      >
        {/* Large Image - with upload support, hidden for Pop-By */}
        {!isPopBy && (
        <div className="relative aspect-[4/3] bg-muted group">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            className="hidden"
          />
          {displayPhotoUrl ? (
            <img
              src={displayPhotoUrl}
              alt={property.address}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Home className="w-12 h-12 text-muted-foreground" />
            </div>
          )}
          {/* Property number badge */}
          <div className="absolute top-3 left-3 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm font-bold">
            #{index + 1}
          </div>
          {/* Rating badge */}
          {property.rating && property.rating.rating !== null && (
            <div className="absolute top-3 right-3 px-2.5 py-1 bg-background/90 backdrop-blur-sm rounded-md flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-semibold">{property.rating.rating}</span>
            </div>
          )}
          {/* Photo upload overlay */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            disabled={uploading}
            className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          >
            {uploading ? (
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            ) : (
              <div className="flex flex-col items-center gap-1">
                <ImagePlus className="w-8 h-8 text-white" />
                <span className="text-white text-xs font-medium">Upload Photo</span>
              </div>
            )}
          </button>
        </div>
        )}

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Property number for Pop-By (since image section is hidden) */}
          {isPopBy && (
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm font-bold">
                #{index + 1}
              </span>
              {property.delivery_completed_at ? (
                <span className="flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-300 rounded-md text-xs font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Delivered
                </span>
              ) : (
                <span className="flex items-center gap-1 px-2 py-1 bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 rounded-md text-xs font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  Pending
                </span>
              )}
            </div>
          )}

          {/* Price */}
          {!isPopBy && property.price && (
            <div className="text-2xl font-display font-bold text-foreground">
              {formatPrice(property.price)}
            </div>
          )}

          {/* Address */}
          <div>
            <p className="font-semibold text-foreground text-sm leading-snug">
              {property.address}
            </p>
            <p className="text-xs text-muted-foreground">
              {[property.city, property.state, property.zip_code].filter(Boolean).join(', ')}
            </p>
          </div>

          {/* Delivery Notes - visible on pop-by cards */}
          {isPopBy && property.agent_notes && (
            <div className="p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-xs">
              <div className="flex items-center gap-1 text-blue-700 dark:text-blue-300 font-medium mb-0.5">
                <ClipboardList className="w-3 h-3" />
                Delivery Notes
              </div>
              <span className="text-foreground">{property.agent_notes}</span>
            </div>
          )}

          {/* Delivery completion info */}
          {isPopBy && property.delivery_completed_at && (
            <div className="p-2 bg-green-50 dark:bg-green-950/30 rounded-lg text-xs">
              <p className="text-green-700 dark:text-green-300 font-medium">
                Delivered at {new Date(property.delivery_completed_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
              </p>
              {property.delivery_notes && (
                <p className="text-foreground mt-0.5">{property.delivery_notes}</p>
              )}
              {property.delivery_photo_url && (
                <img
                  src={property.delivery_photo_url}
                  alt="Delivery"
                  className="w-16 h-16 rounded object-cover mt-1 cursor-pointer"
                  onClick={(e) => { e.stopPropagation(); window.open(property.delivery_photo_url!, '_blank'); }}
                />
              )}
            </div>
          )}

          {/* Showing Time - Editable */}
          {editingTimeId === property.id ? (
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <Input
                type="time"
                value={timeValue}
                onChange={(e) => setTimeValue(e.target.value)}
                className="h-9 flex-1 text-sm"
                autoFocus
              />
              <Button
                size="sm"
                className="h-9 px-3"
                onClick={() => onSaveTime(property.id)}
              >
                Save
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-9 px-2"
                onClick={onCancelEditTime}
              >
                ✕
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEditTime(property.id, property.showing_time || '');
                }}
                className="flex-1 flex items-center gap-2 px-3 py-2 bg-primary/10 hover:bg-primary/15 border border-primary/20 rounded-lg transition-colors cursor-pointer"
              >
                <Clock className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">
                  {formatDisplayTime(property.showing_time) || 'Add time'}
                </span>
              </button>
              {!isPopBy && onShowingDurationChange && (
                <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">Showing Duration:</span>
                  <Select
                    value={String(showingDuration)}
                    onValueChange={(v) => onShowingDurationChange(property.id, Number(v))}
                  >
                    <SelectTrigger className="h-9 w-[80px] text-xs px-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 min</SelectItem>
                      <SelectItem value="30">30 min</SelectItem>
                      <SelectItem value="45">45 min</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          {/* Stats */}
          {!isPopBy && (property.beds || property.baths || property.sqft) && (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              {property.beds && <span>{property.beds} Bd</span>}
              {property.baths && <span>• {property.baths} Ba</span>}
              {property.sqft && <span>• {property.sqft.toLocaleString()} Sq Ft</span>}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEditDetails(property.id, `${property.address}${property.city ? `, ${property.city}` : ''}${property.state ? `, ${property.state}` : ''}`)}
              className="flex-1 gap-1.5"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </Button>
            {!isPopBy && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onManageDocs(property.id, `${property.address}${property.city ? `, ${property.city}` : ''}${property.state ? `, ${property.state}` : ''}`)}
              className="flex-1 gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              {property.doc_count ? `Docs (${property.doc_count})` : 'Docs'}
            </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(property.id)}
              className="px-2 text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const SessionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<ShowingSession | null>(null);
  const [properties, setProperties] = useState<SessionProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddPropertyOpen, setIsAddPropertyOpen] = useState(false);
  const [isAddAddressOpen, setIsAddAddressOpen] = useState(false);
  const isPopBy = session?.session_type === 'pop_by';
  const [isQROpen, setIsQROpen] = useState(false);
  const [isEditSessionOpen, setIsEditSessionOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [docsPropertyId, setDocsPropertyId] = useState<string | null>(null);
  const [docsPropertyAddress, setDocsPropertyAddress] = useState('');
  const [isOptimizing, setIsOptimizing] = useState(false);
const [startingAddress, setStartingAddress] = useState({ street: '', city: '', state: '', zip: '' });
const [endingAddress, setEndingAddress] = useState({ street: '', city: '', state: '', zip: '' });
  const [savedAddresses, setSavedAddresses] = useState<Array<{ id: string; label: string; street: string; city: string; state: string; zip: string }>>([]);
  const [showSaveAddressDialog, setShowSaveAddressDialog] = useState(false);
  const [newAddressLabel, setNewAddressLabel] = useState('');
  const [showManageAddresses, setShowManageAddresses] = useState(false);
  const [brokerageLogo, setBrokerageLogo] = useState<string | null>(null);
  const [editDetailsPropertyId, setEditDetailsPropertyId] = useState<string | null>(null);
  const [showingDurations, setShowingDurations] = useState<Record<string, number>>({});
  const [legDurations, setLegDurations] = useState<Array<{ from: string; to: string; seconds: number }>>([]);
  const [routeCoordinates, setRouteCoordinates] = useState<Array<{ id: string; lat: number; lng: number }>>([]);
  const [editDetailsPropertyAddress, setEditDetailsPropertyAddress] = useState('');
  const [selectedProperties, setSelectedProperties] = useState<Set<string>>(new Set());
  const [editingTimeId, setEditingTimeId] = useState<string | null>(null);
  const [timeValue, setTimeValue] = useState('');
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [isRoutePopoverOpen, setIsRoutePopoverOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'gallery'>('list');
  const [recentlyDeleted, setRecentlyDeleted] = useState<SessionProperty[]>([]);
  const [showArchive, setShowArchive] = useState(false);
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);

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

  // Load saved addresses from localStorage
  useEffect(() => {
    const loadSavedAddresses = () => {
      try {
        const saved = localStorage.getItem('homefolio_saved_addresses');
        if (saved) {
          setSavedAddresses(JSON.parse(saved));
        }
      } catch (error) {
        console.error('Error loading saved addresses:', error);
      }
    };
    loadSavedAddresses();
  }, []);

  const saveAddressToList = (label: string, address: { street: string; city: string; state: string; zip: string }) => {
    const newAddress = {
      id: crypto.randomUUID(),
      label,
      ...address,
    };
    const updated = [...savedAddresses, newAddress];
    setSavedAddresses(updated);
    localStorage.setItem('homefolio_saved_addresses', JSON.stringify(updated));
    toast.success(`Address saved as "${label}"`);
  };

  const deleteAddress = (id: string) => {
    const updated = savedAddresses.filter(addr => addr.id !== id);
    setSavedAddresses(updated);
    localStorage.setItem('homefolio_saved_addresses', JSON.stringify(updated));
    toast.success('Address deleted');
  };

  const loadAddress = (addressId: string) => {
    const address = savedAddresses.find(addr => addr.id === addressId);
    if (address) {
      setStartingAddress({
        street: address.street,
        city: address.city,
        state: address.state,
        zip: address.zip,
      });
      toast.success(`Loaded "${address.label}"`);
    }
  };

  const handleSaveCurrentAddress = () => {
    if (!newAddressLabel.trim()) {
      toast.error('Please enter a label for this address');
      return;
    }
    if (!startingAddress.street) {
      toast.error('Please enter a street address first');
      return;
    }
    saveAddressToList(newAddressLabel, startingAddress);
    setNewAddressLabel('');
    setShowSaveAddressDialog(false);
  };

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
    recipientName?: string;
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
        recipient_name: data.recipientName || null,
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
    recipientName?: string;
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

      const mapToRow = (data: typeof propertiesData[0], sessionId: string, orderIndex: number) => ({
        session_id: sessionId,
        address: data.address,
        city: data.city || null,
        state: data.state || null,
        zip_code: data.zipCode || null,
        recipient_name: data.recipientName || null,
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
        order_index: orderIndex,
      });

      const BATCH_SIZE = 50;
      const maxOrder = properties.reduce((max, p) => Math.max(max, p.order_index), -1);

      if (propertiesData.length <= BATCH_SIZE) {
        // All fit in current session
        const insertData = propertiesData.map((data, index) => mapToRow(data, id!, maxOrder + 1 + index));
        const { error } = await supabase.from('session_properties').insert(insertData);
        if (error) throw error;
        toast.success(`${propertiesData.length} ${isPopBy ? 'addresses' : 'properties'} added!`);
      } else {
        // Auto-split into batches of 50
        const batches: Array<typeof propertiesData> = [];
        for (let i = 0; i < propertiesData.length; i += BATCH_SIZE) {
          batches.push(propertiesData.slice(i, i + BATCH_SIZE));
        }

        // First batch → current session
        const firstBatch = batches[0].map((data, index) => mapToRow(data, id!, maxOrder + 1 + index));
        const { error: firstError } = await supabase.from('session_properties').insert(firstBatch);
        if (firstError) throw firstError;

        // Remaining batches → new sessions
        const newSessionIds: string[] = [];
        for (let b = 1; b < batches.length; b++) {
          const dayNumber = b + 1;
          const { data: newSession, error: createError } = await supabase
            .from('showing_sessions')
            .insert({
              admin_id: user.id,
              title: `${session?.title} - Day ${dayNumber}`,
              client_name: session?.client_name,
              session_date: session?.session_date,
              notes: session?.notes,
              share_password: session?.share_password,
              session_type: session?.session_type || 'home_folio',
            })
            .select('id')
            .single();

          if (createError) throw createError;
          newSessionIds.push(newSession.id);

          const batchData = batches[b].map((data, index) => mapToRow(data, newSession.id, index));
          const { error: insertError } = await supabase.from('session_properties').insert(batchData);
          if (insertError) throw insertError;
        }

        toast.success(
          `${propertiesData.length} addresses imported across ${batches.length} sessions (${batches.map(b => b.length).join(' + ')})`,
          newSessionIds.length === 1
            ? { action: { label: 'Open Day 2', onClick: () => navigate(`/admin/showings/${newSessionIds[0]}`) } }
            : undefined,
        );
      }

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

  /**
   * Fetch OSRM driving time between two coordinates.
   * Returns seconds, or a haversine estimate if OSRM fails.
   */
  const fetchDrivingTime = async (
    from: { lat: number; lng: number },
    to: { lat: number; lng: number }
  ): Promise<number> => {
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=false`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        if (data.code === 'Ok' && data.routes?.[0]) {
          return data.routes[0].duration;
        }
      }
    } catch (err) {
      console.warn('OSRM fetch failed, using haversine estimate');
    }
    // Haversine fallback
    const R = 6371000;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(to.lat - from.lat);
    const dLon = toRad(to.lng - from.lng);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.sin(dLon / 2) ** 2;
    const dist = 2 * R * Math.asin(Math.sqrt(a));
    return (dist * 1.4) / (40000 / 3600);
  };

  /** Restore a previously deleted property back into the session */
  const handleRestoreProperty = async (property: SessionProperty, originalIndex: number) => {
    try {
      const { error } = await supabase
        .from('session_properties')
        .insert({
          id: property.id,
          session_id: id,
          address: property.address,
          city: property.city,
          state: property.state,
          zip_code: property.zip_code,
          price: property.price,
          photo_url: property.photo_url,
          order_index: originalIndex,
          beds: property.beds,
          baths: property.baths,
          sqft: property.sqft,
          showing_time: property.showing_time,
          agent_notes: property.agent_notes,
          recipient_name: property.recipient_name,
        });

      if (error) throw error;

      // Remove from recently deleted
      setRecentlyDeleted(prev => prev.filter(p => p.id !== property.id));

      // Re-fetch to get correct order
      fetchProperties();
      toast.success('Property restored');
    } catch (error) {
      toast.error('Failed to restore property');
    }
  };

  const handleDeleteProperty = async (propertyId: string) => {
    try {
      // Save property data before deleting (for undo)
      const deletedProperty = properties.find(p => p.id === propertyId);
      const deletedIndex = properties.findIndex(p => p.id === propertyId);

      const { error } = await supabase
        .from('session_properties')
        .delete()
        .eq('id', propertyId);

      if (error) throw error;

      // Update properties locally — no fetchProperties() needed
      const newProperties = properties.filter(p => p.id !== propertyId);
      setProperties(newProperties);

      setSelectedProperties((prev) => {
        const next = new Set(prev);
        next.delete(propertyId);
        return next;
      });

      // Add to recently deleted archive
      if (deletedProperty) {
        setRecentlyDeleted(prev => [...prev, deletedProperty]);
      }

      // Show toast with undo
      toast.success('Property removed', {
        action: {
          label: 'Undo',
          onClick: () => {
            if (deletedProperty) handleRestoreProperty(deletedProperty, deletedIndex);
          },
        },
        duration: 8000,
      });

      // Recalculate driving times if route was optimized
      if (legDurations.length > 0 && routeCoordinates.length > 0) {
        const prevProperty = deletedIndex > 0 ? properties[deletedIndex - 1] : null;
        const nextProperty = deletedIndex < properties.length - 1 ? properties[deletedIndex + 1] : null;

        // Remove legs involving deleted property
        const newLegs = legDurations.filter(
          leg => leg.from !== propertyId && leg.to !== propertyId
        );

        // Calculate new leg for the gap (prev→next)
        if (prevProperty && nextProperty) {
          const prevCoord = routeCoordinates.find(c => c.id === prevProperty.id);
          const nextCoord = routeCoordinates.find(c => c.id === nextProperty.id);

          if (prevCoord && nextCoord) {
            const seconds = await fetchDrivingTime(prevCoord, nextCoord);
            newLegs.push({ from: prevProperty.id, to: nextProperty.id, seconds });
          }
        }

        setLegDurations(newLegs);
        setRouteCoordinates(prev => prev.filter(c => c.id !== propertyId));
      }
    } catch (error) {
      toast.error('Failed to delete property');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProperties.size === 0) return;

    try {
      const removedIds = new Set(selectedProperties);
      const deletedProps = properties.filter(p => removedIds.has(p.id));

      const { error } = await supabase
        .from('session_properties')
        .delete()
        .in('id', Array.from(selectedProperties));

      if (error) throw error;

      // Update properties locally
      const newProperties = properties.filter(p => !removedIds.has(p.id));
      setProperties(newProperties);

      // Add to recently deleted archive
      setRecentlyDeleted(prev => [...prev, ...deletedProps]);

      const count = selectedProperties.size;
      setSelectedProperties(new Set());

      // Show toast with undo
      toast.success(`${count} properties removed`, {
        action: {
          label: 'Undo',
          onClick: async () => {
            try {
              const inserts = deletedProps.map(p => ({
                id: p.id,
                session_id: id,
                address: p.address,
                city: p.city,
                state: p.state,
                zip_code: p.zip_code,
                price: p.price,
                photo_url: p.photo_url,
                order_index: p.order_index,
                beds: p.beds,
                baths: p.baths,
                sqft: p.sqft,
                showing_time: p.showing_time,
                agent_notes: p.agent_notes,
                recipient_name: p.recipient_name,
              }));
              await supabase.from('session_properties').insert(inserts);
              setRecentlyDeleted(prev => prev.filter(p => !removedIds.has(p.id)));
              fetchProperties();
              toast.success(`${count} properties restored`);
            } catch {
              toast.error('Failed to restore properties');
            }
          },
        },
        duration: 8000,
      });

      // Recalculate driving times if route was optimized
      if (legDurations.length > 0 && routeCoordinates.length > 0) {
        const newRouteCoords = routeCoordinates.filter(c => !removedIds.has(c.id));

        // Keep legs not involving any removed property
        const keptLegs = legDurations.filter(
          leg => !removedIds.has(leg.from) && !removedIds.has(leg.to)
        );
        const keptLegKeys = new Set(keptLegs.map(l => `${l.from}→${l.to}`));

        // Find adjacent pairs needing new driving times
        const newLegs = [...keptLegs];
        for (let i = 0; i < newRouteCoords.length - 1; i++) {
          const key = `${newRouteCoords[i].id}→${newRouteCoords[i + 1].id}`;
          if (!keptLegKeys.has(key)) {
            const seconds = await fetchDrivingTime(newRouteCoords[i], newRouteCoords[i + 1]);
            newLegs.push({ from: newRouteCoords[i].id, to: newRouteCoords[i + 1].id, seconds });
          }
        }

        setLegDurations(newLegs);
        setRouteCoordinates(newRouteCoords);
      }
    } catch (error) {
      toast.error('Failed to delete properties');
    }
  };

  const handleOpenMoveDialog = () => {
    if (selectedProperties.size === 0 || !session) return;
    setIsMoveDialogOpen(true);
  };

  /** Move selected properties to an existing session */
  const handleMoveToExisting = async (targetSessionId: string, targetTitle: string) => {
    if (selectedProperties.size === 0) return;

    try {
      const selectedIds = Array.from(selectedProperties);

      // Get current max order_index in target session
      const { data: existingProps } = await supabase
        .from('session_properties')
        .select('order_index')
        .eq('session_id', targetSessionId)
        .order('order_index', { ascending: false })
        .limit(1);

      const startIndex = (existingProps?.[0]?.order_index ?? -1) + 1;

      // Move properties to target session
      const updates = selectedIds.map((propId, idx) =>
        supabase
          .from('session_properties')
          .update({ session_id: targetSessionId, order_index: startIndex + idx })
          .eq('id', propId)
      );
      await Promise.all(updates);

      // Re-index remaining properties in current session
      const remainingProperties = properties.filter(p => !selectedProperties.has(p.id));
      const reindexUpdates = remainingProperties.map((prop, idx) =>
        supabase
          .from('session_properties')
          .update({ order_index: idx })
          .eq('id', prop.id)
      );
      await Promise.all(reindexUpdates);

      toast.success(`Moved ${selectedIds.length} ${isPopBy ? 'addresses' : 'properties'} to "${targetTitle}"`, {
        action: {
          label: 'Open',
          onClick: () => navigate(`/admin/showings/${targetSessionId}`),
        },
      });
      setSelectedProperties(new Set());
      fetchProperties();
    } catch (error: any) {
      console.error('Move to existing session error:', error);
      toast.error(error.message || 'Failed to move properties');
    }
  };

  /** Create a new session and move selected properties to it */
  const handleMoveToNew = async (sessionLabel: string) => {
    if (selectedProperties.size === 0 || !session) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please sign in');
        return;
      }

      // Create a new session with same settings
      const { data: newSession, error: createError } = await supabase
        .from('showing_sessions')
        .insert({
          admin_id: user.id,
          title: sessionLabel,
          client_name: session.client_name,
          session_date: session.session_date,
          notes: session.notes,
          share_password: session.share_password,
          session_type: session.session_type || 'home_folio',
        })
        .select('id')
        .single();

      if (createError) throw createError;

      // Move selected properties to the new session
      const selectedIds = Array.from(selectedProperties);
      const updates = selectedIds.map((propId, idx) =>
        supabase
          .from('session_properties')
          .update({ session_id: newSession.id, order_index: idx })
          .eq('id', propId)
      );
      await Promise.all(updates);

      // Re-index remaining properties in the current session
      const remainingProperties = properties.filter(p => !selectedProperties.has(p.id));
      const reindexUpdates = remainingProperties.map((prop, idx) =>
        supabase
          .from('session_properties')
          .update({ order_index: idx })
          .eq('id', prop.id)
      );
      await Promise.all(reindexUpdates);

      toast.success(`Moved ${selectedIds.length} ${isPopBy ? 'addresses' : 'properties'} to "${sessionLabel}"`, {
        action: {
          label: 'Open',
          onClick: () => navigate(`/admin/showings/${newSession.id}`),
        },
      });
      setSelectedProperties(new Set());
      fetchProperties();
    } catch (error: any) {
      console.error('Move to new session error:', error);
      toast.error(error.message || 'Failed to move properties');
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

  const handleOpenLink = () => {
    if (!session) return;
    const publicOrigin = getPublicShareOrigin();
    const link = `${publicOrigin}/s/${session.share_token}`;
    window.open(link, '_blank');
  };

  const handleCopyAccessCode = () => {
    if (!session?.share_password) return;
    navigator.clipboard.writeText(session.share_password);
    toast.success('Access code copied to clipboard!');
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

  const formatDisplayTime = (time: string | null | undefined) => {
    if (!time) return null;
    // Convert 24h format (HH:mm:ss or HH:mm) to 12h format
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
  };

  const handleSaveTime = async (propertyId: string) => {
    try {
      const { error } = await supabase
        .from('session_properties')
        .update({ showing_time: timeValue || null })
        .eq('id', propertyId);

      if (error) throw error;

      toast.success('Time saved!');
      setEditingTimeId(null);
      setTimeValue('');
      fetchSession();
    } catch (error: any) {
      console.error('Error saving time:', error);
      toast.error(error.message || 'Failed to save time');
    }
  };

  const handleAutoScheduleTimes = async () => {
    if (properties.length === 0) {
      toast.info('Add properties first to auto-schedule times');
      return;
    }

    // Check if route has been optimized (need at least properties.length - 1 legs)
    if (legDurations.length === 0 && properties.length > 1) {
      toast.error('Please optimize the route first!', {
        description: 'Click "Optimize Route" to calculate driving times between properties'
      });
      return;
    }

    try {
      console.log('[Auto-Schedule] Starting with', properties.length, 'properties');
      console.log('[Auto-Schedule] Leg durations:', legDurations);

      // Get start time from first property or ask user
      let startTime = properties[0].showing_time;

      if (!startTime) {
        // Use window.prompt for start time
        const userInput = window.prompt('Enter start time for first showing\n\nFormat: HH:MM (e.g., 14:00 for 2:00 PM)');
        if (!userInput) {
          toast.info('Auto-schedule cancelled');
          return;
        }

        // Validate format
        if (!/^\d{1,2}:\d{2}$/.test(userInput)) {
          toast.error('Invalid time format. Use HH:MM (e.g., 14:00)');
          return;
        }

        startTime = userInput;
      }

      console.log('[Auto-Schedule] Starting time:', startTime);

      // Parse start time
      const timeParts = startTime.split(':');
      const startHours = parseInt(timeParts[0], 10);
      const startMinutes = parseInt(timeParts[1], 10);

      // Validate parsed time
      if (isNaN(startHours) || isNaN(startMinutes) || startHours > 23 || startMinutes > 59) {
        toast.error('Invalid time. Hours: 0-23, Minutes: 0-59');
        return;
      }

      let currentTimeMinutes = startHours * 60 + startMinutes;
      const updates = [];

      // Schedule each property
      for (let i = 0; i < properties.length; i++) {
        const property = properties[i];

        // Format current time as HH:mm
        const hours = Math.floor(currentTimeMinutes / 60);
        const minutes = currentTimeMinutes % 60;
        const timeString = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

        console.log(`[Auto-Schedule] Property ${i + 1}/${properties.length}: ${timeString}`);

        // Update this property's time
        updates.push(
          supabase
            .from('session_properties')
            .update({ showing_time: timeString })
            .eq('id', property.id)
        );

        // Calculate next showing start time
        if (i < properties.length - 1) {
          // Pop-by: 2 min stop per address; Home Folio: per-property duration (default 30)
          const stopMinutes = isPopBy ? 2 : (showingDurations[property.id] || 30);
          currentTimeMinutes += stopMinutes;

          // Add driving time to next property
          const drivingData = legDurations.find(
            leg => leg.from === property.id && leg.to === properties[i + 1].id
          );

          if (drivingData) {
            const drivingMinutes = Math.ceil(drivingData.seconds / 60);
            console.log(`[Auto-Schedule] + ${drivingMinutes} min drive to next property`);
            currentTimeMinutes += drivingMinutes;
          } else {
            // If no driving data found, add buffer (5 min for pop-by, 15 min for showing)
            const bufferMinutes = isPopBy ? 5 : 15;
            console.log(`[Auto-Schedule] No driving data, adding ${bufferMinutes} min buffer`);
            currentTimeMinutes += bufferMinutes;
          }
        }
      }

      console.log('[Auto-Schedule] Saving', updates.length, 'time updates');

      await Promise.all(updates);
      await fetchProperties();

      toast.success(`${properties.length} ${isPopBy ? 'addresses' : 'properties'} scheduled!`, {
        description: isPopBy ? '2 min per stop + driving time' : 'Per-property durations + driving time'
      });
    } catch (error: any) {
      console.error('[Auto-Schedule] Error:', error);
      toast.error(error.message || 'Failed to auto-schedule times');
    }
  };

  const handleOptimizeRoute = async () => {
    if (properties.length < 2) {
      toast.info(ERROR_MESSAGES.ROUTE_NO_PROPERTIES);
      return;
    }

    setIsOptimizing(true);
    let retryCount = 0;

    try {
      // Use retry logic for the route optimization call
      const { data, error } = await retryOperation(
        async () => {
          return await supabase.functions.invoke('optimize-route', {
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
        },
        {
          maxRetries: 2,
          initialDelay: 1000,
          onRetry: (attempt, error) => {
            retryCount = attempt;
            toast.info(`Retrying route optimization (attempt ${attempt}/2)...`);
            logError(error, { context: 'route-optimization-retry', attempt });
          },
        }
      );

      if (error) {
        logError(error, { context: 'route-optimization', properties: properties.length });
        throw error;
      }

      if (data.error) {
        const errorMsg = data.error.includes('geocod')
          ? ERROR_MESSAGES.GEOCODE_FAILED
          : data.error;
        toast.error(errorMsg);
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

      // Auto-delete properties whose addresses could not be geocoded
      const ungeocodedIds: string[] = data.ungeocodedIds || [];
      const failedAddresses: string[] = data.failedAddresses || [];

      if (ungeocodedIds.length > 0) {
        console.log(`Auto-removing ${ungeocodedIds.length} properties with invalid addresses:`, failedAddresses);
        await Promise.all(
          ungeocodedIds.map(id =>
            supabase.from('session_properties').delete().eq('id', id)
          )
        );
        toast.info(
          `Removed ${ungeocodedIds.length} ${ungeocodedIds.length === 1 ? 'address' : 'addresses'} that could not be located`,
          { description: failedAddresses.join(', ') }
        );
      }

      let successMessage = retryCount > 0
        ? `Route optimized after ${retryCount} ${retryCount === 1 ? 'retry' : 'retries'}! Total drive time: ${timeStr}`
        : `Route optimized! Total drive time: ${timeStr}`;

      if (data.usedHaversine) {
        successMessage += ' (estimated — routing service unavailable)';
      }

      toast.success(successMessage);

      const updates = optimizedOrder.map((propId, newIndex) =>
        supabase
          .from('session_properties')
          .update({ order_index: newIndex })
          .eq('id', propId)
      );

      await Promise.all(updates);
      fetchProperties();
    } catch (error: any) {
      logError(error, { context: 'route-optimization-final', properties: properties.length });
      const userMessage = getErrorMessage(error);
      toast.error(userMessage);
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
              onClick={handleOpenLink}
            >
              <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Open Link
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

          {/* Access Code Display */}
          {session.share_password && (
            <div className="mt-3 p-3 bg-muted/50 rounded-lg border border-border">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground mb-1">Access Code</p>
                  <p className="font-mono font-semibold text-sm">{session.share_password}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyAccessCode}
                  className="flex-shrink-0"
                >
                  <Copy className="w-3.5 h-3.5 mr-1.5" />
                  Copy
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Properties Section */}
        <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg sm:text-xl font-semibold text-foreground">
              {isPopBy ? 'Addresses' : 'Properties'} ({properties.length})
            </h2>
            <Button
              variant="accent"
              size="sm"
              className="gap-1.5 h-9 text-xs sm:text-sm"
              onClick={() => isPopBy ? setIsAddAddressOpen(true) : setIsAddPropertyOpen(true)}
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {isPopBy ? 'Add Address' : 'Add Property'}
            </Button>
          </div>
          
          {/* Secondary actions row */}
          <div className="flex flex-wrap gap-2 items-center justify-between">
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
                      <div className="flex items-center justify-between mb-1.5">
                        <Label className="text-xs sm:text-sm font-medium">Starting Location</Label>
                        <div className="flex gap-1">
                          <Dialog open={showSaveAddressDialog} onOpenChange={setShowSaveAddressDialog}>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 text-xs px-2"
                                type="button"
                                disabled={!startingAddress.street}
                              >
                                Save
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                              <DialogHeader>
                                <DialogTitle>Save Address</DialogTitle>
                                <DialogDescription>
                                  Give this address a label to save it for future use
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                  <Label htmlFor="address-label">Label</Label>
                                  <Input
                                    id="address-label"
                                    placeholder="e.g., Home, Office, Brokerage"
                                    value={newAddressLabel}
                                    onChange={(e) => setNewAddressLabel(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleSaveCurrentAddress();
                                      }
                                    }}
                                  />
                                </div>
                                <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                                  <p className="text-sm font-medium">Address to save:</p>
                                  <p className="text-xs text-muted-foreground">
                                    {[startingAddress.street, startingAddress.city, startingAddress.state, startingAddress.zip]
                                      .filter(Boolean)
                                      .join(', ') || 'No address entered'}
                                  </p>
                                </div>
                                <div className="flex gap-2 justify-end">
                                  <Button
                                    variant="outline"
                                    onClick={() => setShowSaveAddressDialog(false)}
                                  >
                                    Cancel
                                  </Button>
                                  <Button onClick={handleSaveCurrentAddress}>
                                    Save Address
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          {savedAddresses.length > 0 && (
                            <Dialog open={showManageAddresses} onOpenChange={setShowManageAddresses}>
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 text-xs px-2"
                                  type="button"
                                >
                                  Manage
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                  <DialogTitle>Manage Saved Addresses</DialogTitle>
                                  <DialogDescription>
                                    View and delete your saved addresses
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-2 py-4 max-h-96 overflow-y-auto">
                                  {savedAddresses.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-8">
                                      No saved addresses yet
                                    </p>
                                  ) : (
                                    savedAddresses.map((addr) => (
                                      <div
                                        key={addr.id}
                                        className="flex items-start justify-between gap-2 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                                      >
                                        <div className="flex-1 min-w-0">
                                          <p className="font-medium text-sm">{addr.label}</p>
                                          <p className="text-xs text-muted-foreground truncate">
                                            {[addr.street, addr.city, addr.state, addr.zip].filter(Boolean).join(', ')}
                                          </p>
                                        </div>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-8 px-2 text-destructive hover:text-destructive"
                                          onClick={() => deleteAddress(addr.id)}
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                      </div>
                                    ))
                                  )}
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                        </div>
                      </div>
                      {savedAddresses.length > 0 && (
                        <div className="mb-2">
                          <Select onValueChange={loadAddress}>
                            <SelectTrigger className="text-sm">
                              <SelectValue placeholder="Load saved address..." />
                            </SelectTrigger>
                            <SelectContent>
                              {savedAddresses.map((addr) => (
                                <SelectItem key={addr.id} value={addr.id}>
                                  <div className="flex flex-col">
                                    <span className="font-medium">{addr.label}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {[addr.street, addr.city].filter(Boolean).join(', ')}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
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
              className="gap-1.5 h-9 text-xs sm:text-sm bg-primary/10 hover:bg-primary/20 border-primary/20"
              onClick={handleAutoScheduleTimes}
            >
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Auto-schedule Times</span>
              <span className="sm:hidden">Times</span>
            </Button>
            {!isPopBy && (
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
            )}
            </div>

            {/* View Toggle */}
            <div className="flex gap-1 border rounded-lg p-1">
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="h-7 px-2"
                title="List view"
              >
                <List className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'gallery' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('gallery')}
                className="h-7 px-2"
                title="Gallery view"
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Route Map - Temporarily disabled due to geocoding issues */}
        {/* TODO: Debug and re-enable map feature */}

        {/* Route Summary Card */}
        {(() => {
          const firstTime = properties[0]?.showing_time;
          const lastProp = properties[properties.length - 1];
          const lastTime = lastProp?.showing_time;
          const hasSchedule = firstTime && lastTime && properties.length >= 2;
          const hasDrivingData = legDurations.length > 0;

          if (!hasSchedule && !hasDrivingData) return null;

          // Parse times
          const parseMinutes = (t: string) => {
            const [h, m] = t.split(':').map(Number);
            return h * 60 + m;
          };
          const formatTime12 = (totalMin: number) => {
            const h = Math.floor(totalMin / 60) % 24;
            const m = totalMin % 60;
            const ampm = h >= 12 ? 'PM' : 'AM';
            const h12 = h % 12 || 12;
            return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
          };

          // Total driving time from leg durations
          const totalDriveSeconds = legDurations
            .filter(l => l.from !== '__origin__')
            .reduce((sum, l) => sum + l.seconds, 0);
          const totalDriveMinutes = Math.round(totalDriveSeconds / 60);

          // Total stop time
          const totalStopMinutes = properties.reduce((sum, p) => {
            return sum + (isPopBy ? 2 : (showingDurations[p.id] || 30));
          }, 0);

          // Start and end times
          const startMin = hasSchedule ? parseMinutes(firstTime) : null;
          const lastStopDuration = isPopBy ? 2 : (showingDurations[lastProp?.id] || 30);
          const endMin = hasSchedule ? parseMinutes(lastTime) + lastStopDuration : null;
          const totalSessionMinutes = startMin !== null && endMin !== null ? endMin - startMin : null;

          const formatDuration = (mins: number) => {
            const h = Math.floor(mins / 60);
            const m = mins % 60;
            if (h > 0 && m > 0) return `${h}h ${m}m`;
            if (h > 0) return `${h}h`;
            return `${m}m`;
          };

          return (
            <Card className="p-4 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                {hasSchedule && startMin !== null && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-primary" />
                    <span className="text-muted-foreground">Start:</span>
                    <span className="font-semibold">{formatTime12(startMin)}</span>
                  </div>
                )}
                {hasSchedule && endMin !== null && (
                  <div className="flex items-center gap-1.5">
                    <Timer className="w-4 h-4 text-primary" />
                    <span className="text-muted-foreground">End:</span>
                    <span className="font-semibold">{formatTime12(endMin)}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span className="font-semibold">{properties.length} {isPopBy ? 'stops' : 'showings'}</span>
                </div>
                {hasDrivingData && totalDriveMinutes > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Car className="w-4 h-4 text-primary" />
                    <span className="text-muted-foreground">Drive:</span>
                    <span className="font-semibold">{formatDuration(totalDriveMinutes)}</span>
                  </div>
                )}
                {totalSessionMinutes !== null && totalSessionMinutes > 0 && (
                  <div className="flex items-center gap-1.5 ml-auto">
                    <Route className="w-4 h-4 text-primary" />
                    <span className="text-muted-foreground">Total:</span>
                    <span className="font-bold text-primary">{formatDuration(totalSessionMinutes)}</span>
                  </div>
                )}
              </div>
            </Card>
          );
        })()}

        {/* Properties List */}
        {properties.length > 0 ? (
          <div className="space-y-3 sm:space-y-4">
            {/* Bulk Actions Bar - Only in List View */}
            {viewMode === 'list' && (
              <BulkActionsBar
                selectedCount={selectedProperties.size}
                onClear={handleClearSelection}
                onSelectAll={handleSelectAll}
                onDelete={handleBulkDelete}
                onMoveToNewSession={handleOpenMoveDialog}
                totalCount={properties.length}
              />
            )}

            {viewMode === 'list' ? (
              /* List View - Drag and Drop */
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
                    {properties.map((property, index) => {
                    // Find driving time to next property
                    const nextProperty = properties[index + 1];
                    const drivingTimeToNext = legDurations.find(
                      leg => leg.from === property.id && leg.to === nextProperty?.id
                    );
                    const drivingMinutes = drivingTimeToNext
                      ? Math.round(drivingTimeToNext.seconds / 60)
                      : null;

                    // Check for driving time from starting point (first property only)
                    const isFirstProperty = index === 0;
                    const drivingFromStart = isFirstProperty ? legDurations.find(
                      leg => leg.from === '__origin__' && leg.to === property.id
                    ) : null;
                    const startDrivingMinutes = drivingFromStart
                      ? Math.round(drivingFromStart.seconds / 60)
                      : null;

                    return (
                      <div key={property.id}>
                        {/* Driving time from starting point (first property only) */}
                        {startDrivingMinutes !== null && (
                          <div className="flex items-center justify-center py-2 mb-2">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 rounded-full text-sm font-medium">
                              <Route className="w-4 h-4" />
                              <span>{startDrivingMinutes} min from starting point</span>
                            </div>
                          </div>
                        )}

                        <SortablePropertyCard
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
                          isPopBy={isPopBy}
                          showingDuration={showingDurations[property.id] || 30}
                          onShowingDurationChange={(id, minutes) => setShowingDurations(prev => ({ ...prev, [id]: minutes }))}
                        />

                        {/* Driving time indicator between properties */}
                        {drivingMinutes !== null && nextProperty && (
                          <div className="flex items-center justify-center py-2">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
                              <Route className="w-4 h-4" />
                              <span>{drivingMinutes} min drive</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </SortableContext>
            </DndContext>
            ) : (
              /* Gallery View - Grid Layout with Drag & Drop */
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={properties.map((p) => p.id)}
                  strategy={rectSortingStrategy}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {properties.map((property, index) => {
                      // Calculate driving times
                      const prevProperty = properties[index - 1];
                      const drivingTimeFromPrev = legDurations.find(
                        leg => leg.from === prevProperty?.id && leg.to === property.id
                      );
                      const drivingMinutes = drivingTimeFromPrev
                        ? Math.round(drivingTimeFromPrev.seconds / 60)
                        : null;

                      // Check for driving time from starting point
                      const isFirstProperty = index === 0;
                      const drivingFromStart = isFirstProperty ? legDurations.find(
                        leg => leg.from === '__origin__' && leg.to === property.id
                      ) : null;
                      const startDrivingMinutes = drivingFromStart
                        ? Math.round(drivingFromStart.seconds / 60)
                        : null;

                      return (
                        <SortableGalleryCard
                          key={property.id}
                          property={property}
                          index={index}
                          onEditTime={(id, time) => {
                            setEditingTimeId(id);
                            setTimeValue(time);
                          }}
                          onSaveTime={handleSaveTime}
                          onCancelEditTime={() => {
                            setEditingTimeId(null);
                            setTimeValue('');
                          }}
                          onEditDetails={(id, address) => {
                            setEditDetailsPropertyId(id);
                            setEditDetailsPropertyAddress(address);
                          }}
                          onManageDocs={(id, address) => {
                            setDocsPropertyId(id);
                            setDocsPropertyAddress(address);
                          }}
                          onDelete={handleDeleteProperty}
                          editingTimeId={editingTimeId}
                          timeValue={timeValue}
                          setTimeValue={setTimeValue}
                          formatDisplayTime={formatDisplayTime}
                          formatPrice={formatPrice}
                          drivingMinutes={drivingMinutes}
                          drivingFromStart={startDrivingMinutes}
                          onPhotoUploaded={fetchProperties}
                          isPopBy={isPopBy}
                          showingDuration={showingDurations[property.id] || 30}
                          onShowingDurationChange={(id, minutes) => setShowingDurations(prev => ({ ...prev, [id]: minutes }))}
                        />
                      );
                    })}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        ) : (
          <div className="text-center py-16 bg-card rounded-xl">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <Home className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-display text-xl font-semibold text-foreground mb-2">
              {isPopBy ? 'No addresses yet' : 'No properties yet'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {isPopBy ? 'Add addresses to this pop-by session' : 'Add properties to this showing session'}
            </p>
            <Button
              variant="accent"
              onClick={() => isPopBy ? setIsAddAddressOpen(true) : setIsAddPropertyOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              {isPopBy ? 'Add First Address' : 'Add First Property'}
            </Button>
          </div>
        )}

        {/* Recently Deleted Archive */}
        {recentlyDeleted.length > 0 && (
          <div className="mt-6">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-muted-foreground hover:text-foreground mb-2"
              onClick={() => setShowArchive(!showArchive)}
            >
              <Archive className="w-4 h-4" />
              Recently Deleted ({recentlyDeleted.length})
              <ChevronDown className={`w-4 h-4 transition-transform ${showArchive ? 'rotate-180' : ''}`} />
            </Button>

            {showArchive && (
              <div className="space-y-2 border border-dashed border-muted-foreground/20 rounded-lg p-3">
                {recentlyDeleted.map((property) => (
                  <div
                    key={property.id}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg opacity-70"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{property.address}</p>
                      {(property.city || property.state || property.zip_code) && (
                        <p className="text-xs text-muted-foreground truncate">
                          {[property.city, property.state, property.zip_code].filter(Boolean).join(', ')}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 ml-3 shrink-0"
                      onClick={() => handleRestoreProperty(property, properties.length)}
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Restore
                    </Button>
                  </div>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-muted-foreground text-xs"
                  onClick={() => {
                    setRecentlyDeleted([]);
                    setShowArchive(false);
                  }}
                >
                  Clear Archive
                </Button>
              </div>
            )}
          </div>
        )}
      </>

      <AddPropertyDialog
        open={isAddPropertyOpen}
        onOpenChange={setIsAddPropertyOpen}
        onAdd={handleAddProperty}
        onAddMultiple={handleAddMultipleProperties}
      />

      <AddAddressDialog
        open={isAddAddressOpen}
        onOpenChange={setIsAddAddressOpen}
        onAdd={handleAddProperty}
        onAddMultiple={handleAddMultipleProperties}
        existingAddresses={properties.map(p => p.address)}
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
        isPopBy={isPopBy}
      />

      <BulkMLSImportDialog
        open={isBulkImportOpen}
        onOpenChange={setIsBulkImportOpen}
        onImport={handleAddMultipleProperties}
        existingAddresses={properties.map(p => p.address)}
      />

      {session && (
        <MoveToSessionDialog
          open={isMoveDialogOpen}
          onOpenChange={setIsMoveDialogOpen}
          selectedCount={selectedProperties.size}
          currentSessionId={session.id}
          sessionType={session.session_type || 'home_folio'}
          currentTitle={session.title}
          onMoveToExisting={handleMoveToExisting}
          onMoveToNew={handleMoveToNew}
        />
      )}
    </AdminLayout>
  );
};

export default SessionDetail;
