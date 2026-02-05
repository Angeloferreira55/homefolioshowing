import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Home,
  FileText,
  ExternalLink,
  Trash2,
  Star,
  MessageSquare,
  GripVertical,
  Pencil,
  ImagePlus,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

interface SortablePropertyCardProps {
  property: SessionProperty;
  index: number;
  isSelected: boolean;
  onSelect: (id: string, selected: boolean) => void;
  onEditNotes: (property: SessionProperty) => void;
  onManageDocs: (property: SessionProperty) => void;
  onDelete: (id: string) => void;
  onPhotoUpdated?: () => void;
  formatPrice: (price: number | null) => string | null;
}

export function SortablePropertyCard({
  property,
  index,
  isSelected,
  onSelect,
  onEditNotes,
  onManageDocs,
  onDelete,
  onPhotoUpdated,
  formatPrice,
}: SortablePropertyCardProps) {
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
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
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

      // Update the property record
      const { error: updateError } = await supabase
        .from('session_properties')
        .update({ photo_url: publicUrl })
        .eq('id', property.id);

      if (updateError) throw updateError;

      setLocalPhotoUrl(publicUrl);
      toast.success('Photo uploaded!');
      onPhotoUpdated?.();
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      toast.error(error.message || 'Failed to upload photo');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const displayPhotoUrl = localPhotoUrl || property.photo_url;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'bg-card rounded-xl p-3 sm:p-4 card-elevated touch-none',
        isDragging && 'opacity-50 shadow-2xl z-50',
        isSelected && 'ring-2 ring-primary'
      )}
    >
      {/* Mobile layout: stacked, Desktop: flex row */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        {/* Top row on mobile: checkbox, drag handle, photo */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Selection checkbox */}
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => onSelect(property.id, !!checked)}
            className="flex-shrink-0 w-5 h-5"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Drag handle */}
          <button
            {...attributes}
            {...listeners}
            className="flex-shrink-0 cursor-grab active:cursor-grabbing p-1 rounded hover:bg-muted transition-colors touch-none"
          >
            <GripVertical className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
          </button>

          {/* Photo with upload button */}
          <div className="flex-shrink-0 relative group/photo">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
            <div className="w-14 h-10 sm:w-20 sm:h-14 rounded-lg bg-muted overflow-hidden">
              {displayPhotoUrl ? (
                <img
                  src={displayPhotoUrl}
                  alt={property.address}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Home className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground" />
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover/photo:opacity-100 transition-opacity rounded-lg"
            >
              {uploading ? (
                <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 text-white animate-spin" />
              ) : (
                <ImagePlus className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
              )}
            </button>
          </div>

          {/* Badge on mobile */}
          <span className="sm:hidden px-2 py-0.5 bg-muted text-muted-foreground text-xs font-medium rounded flex-shrink-0">
            #{index + 1}
          </span>
        </div>

        {/* Info section */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start sm:items-center gap-2 flex-wrap">
            <span className="hidden sm:inline px-2 py-0.5 bg-muted text-muted-foreground text-xs font-medium rounded flex-shrink-0">
              #{index + 1}
            </span>
            <h3 className="font-semibold text-foreground text-sm sm:text-base line-clamp-2 sm:truncate">
              {property.address}
              {property.city && `, ${property.city}`}
              {property.state && `, ${property.state}`}
              {property.zip_code && ` ${property.zip_code}`}
            </h3>
            {property.rating && (
              <div className="flex items-center gap-1 px-2 py-0.5 bg-accent/10 text-accent text-xs font-medium rounded flex-shrink-0">
                <Star className="w-3 h-3 fill-current" />
                {property.rating.rating}/10
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 sm:gap-3 mt-1 flex-wrap">
            {property.price && (
              <span className="text-accent font-medium text-sm sm:text-base">
                {formatPrice(property.price)}
              </span>
            )}
            {(property.beds || property.baths || property.sqft) && (
              <span className="text-muted-foreground text-xs sm:text-sm">
                {property.beds && `${property.beds} bed`}
                {property.beds && property.baths && ' · '}
                {property.baths && `${property.baths} bath`}
                {(property.beds || property.baths) && property.sqft && ' · '}
                {property.sqft && `${property.sqft.toLocaleString()} sqft`}
              </span>
            )}
          </div>
          {/* Client Feedback Summary - condensed on mobile */}
          {property.rating?.feedback && Object.keys(property.rating.feedback).length > 0 && (
            <div className="mt-2 p-2 bg-muted/50 rounded-lg text-xs sm:text-sm space-y-1">
              <div className="flex items-center gap-1 text-muted-foreground font-medium">
                <MessageSquare className="w-3 h-3" />
                <span className="text-xs">Client Feedback</span>
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
                <p className="text-muted-foreground text-xs">
                  <span className="font-medium">Price:</span>{' '}
                  {property.rating.feedback.priceFeel === 'fair' && 'Fair'}
                  {property.rating.feedback.priceFeel === 'high' && 'Too High'}
                  {property.rating.feedback.priceFeel === 'low' && 'Great Value'}
                </p>
              )}
              <div className="hidden sm:block">
                {property.rating.feedback.topThingsLiked && (
                  <p className="text-muted-foreground truncate text-xs">
                    <span className="font-medium">Liked:</span> {property.rating.feedback.topThingsLiked}
                  </p>
                )}
                {property.rating.feedback.concerns && (
                  <p className="text-muted-foreground truncate text-xs">
                    <span className="font-medium">Concerns:</span> {property.rating.feedback.concerns}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Actions - responsive grid on mobile */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 flex-wrap sm:flex-nowrap">
          <Button
            variant="outline"
            size="sm"
            className="gap-1 h-8 sm:h-9 text-xs sm:text-sm px-2 sm:px-3"
            onClick={() => onEditNotes(property)}
          >
            <Pencil className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span className="hidden xs:inline">Edit</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1 h-8 sm:h-9 text-xs sm:text-sm px-2 sm:px-3"
            onClick={() => onManageDocs(property)}
          >
            <FileText className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span className="hidden xs:inline">Docs</span>
            {property.doc_count ? <span className="text-muted-foreground">({property.doc_count})</span> : null}
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            className="h-8 w-8 sm:h-9 sm:w-9"
          >
            <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:text-destructive h-8 w-8 sm:h-9 sm:w-9"
            onClick={() => onDelete(property.id)}
          >
            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
