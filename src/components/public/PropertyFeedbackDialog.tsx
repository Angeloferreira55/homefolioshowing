import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Star } from 'lucide-react';

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

interface PropertyFeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  propertyAddress: string;
  existingRating?: number;
  existingFeedback?: FeedbackData;
  onSaved: () => void;
}

const PropertyFeedbackDialog = ({
  open,
  onOpenChange,
  propertyId,
  propertyAddress,
  existingRating = 5,
  existingFeedback,
  onSaved,
}: PropertyFeedbackDialogProps) => {
  const [rating, setRating] = useState(existingRating);
  const [feedback, setFeedback] = useState<FeedbackData>(existingFeedback || {});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setRating(existingRating);
    setFeedback(existingFeedback || {});
  }, [existingRating, existingFeedback, propertyId]);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      // Check if rating exists
      const { data: existing } = await supabase
        .from('property_ratings')
        .select('id')
        .eq('session_property_id', propertyId)
        .single();

      const feedbackJson = JSON.stringify(feedback);

      if (existing) {
        await supabase
          .from('property_ratings')
          .update({ rating, feedback: feedbackJson })
          .eq('id', existing.id);
      } else {
        await supabase.from('property_ratings').insert({
          session_property_id: propertyId,
          rating,
          feedback: feedbackJson,
        });
      }

      toast.success('Feedback saved!');
      onSaved();
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to save feedback');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <Star className="w-5 h-5 text-gold" />
            Rate This Home
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{propertyAddress}</p>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Rating Slider */}
          <div className="space-y-3">
            <Label className="text-base font-medium">
              How would you rate this home? ({rating}/10)
            </Label>
            <Slider
              value={[rating]}
              onValueChange={(v) => setRating(v[0])}
              min={1}
              max={10}
              step={1}
              className="py-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Not for me</span>
              <span>Love it!</span>
            </div>
          </div>

          {/* Top 3 things liked */}
          <div className="space-y-2">
            <Label htmlFor="topThingsLiked">Top 3 things you liked</Label>
            <Textarea
              id="topThingsLiked"
              placeholder="Layout, location, backyard..."
              value={feedback.topThingsLiked || ''}
              onChange={(e) => setFeedback({ ...feedback, topThingsLiked: e.target.value })}
              className="resize-none"
              rows={2}
            />
          </div>

          {/* Concerns */}
          <div className="space-y-2">
            <Label htmlFor="concerns">Concerns or dealbreakers</Label>
            <Textarea
              id="concerns"
              placeholder="Too small, needs renovation..."
              value={feedback.concerns || ''}
              onChange={(e) => setFeedback({ ...feedback, concerns: e.target.value })}
              className="resize-none"
              rows={2}
            />
          </div>

          {/* Lifestyle Fit */}
          <div className="space-y-2">
            <Label>Did the home feel like it could fit your lifestyle?</Label>
            <RadioGroup
              value={feedback.lifestyleFit || ''}
              onValueChange={(v) => setFeedback({ ...feedback, lifestyleFit: v as FeedbackData['lifestyleFit'] })}
              className="flex gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="lifestyle-yes" />
                <Label htmlFor="lifestyle-yes" className="font-normal cursor-pointer">Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="lifestyle-no" />
                <Label htmlFor="lifestyle-no" className="font-normal cursor-pointer">No</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="not_sure" id="lifestyle-unsure" />
                <Label htmlFor="lifestyle-unsure" className="font-normal cursor-pointer">Not sure</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Layout thoughts */}
          <div className="space-y-2">
            <Label htmlFor="layoutThoughts">How did you feel about the layout / flow of the house?</Label>
            <Textarea
              id="layoutThoughts"
              placeholder="Open concept worked well, bedrooms felt cramped..."
              value={feedback.layoutThoughts || ''}
              onChange={(e) => setFeedback({ ...feedback, layoutThoughts: e.target.value })}
              className="resize-none"
              rows={2}
            />
          </div>

          {/* Price Feel */}
          <div className="space-y-2">
            <Label>Does the price feel:</Label>
            <RadioGroup
              value={feedback.priceFeel || ''}
              onValueChange={(v) => setFeedback({ ...feedback, priceFeel: v as FeedbackData['priceFeel'] })}
              className="flex gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="too_high" id="price-high" />
                <Label htmlFor="price-high" className="font-normal cursor-pointer">Too high</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="fair" id="price-fair" />
                <Label htmlFor="price-fair" className="font-normal cursor-pointer">Fair</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="great_value" id="price-value" />
                <Label htmlFor="price-value" className="font-normal cursor-pointer">A great value</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Neighborhood thoughts */}
          <div className="space-y-2">
            <Label htmlFor="neighborhoodThoughts">How do you feel about the neighborhood and location?</Label>
            <Textarea
              id="neighborhoodThoughts"
              placeholder="Loved the quiet street, schools nearby..."
              value={feedback.neighborhoodThoughts || ''}
              onChange={(e) => setFeedback({ ...feedback, neighborhoodThoughts: e.target.value })}
              className="resize-none"
              rows={2}
            />
          </div>

          {/* Condition concerns */}
          <div className="space-y-2">
            <Label htmlFor="conditionConcerns">Any concerns about the home's condition or maintenance?</Label>
            <Textarea
              id="conditionConcerns"
              placeholder="Roof looks old, HVAC might need work..."
              value={feedback.conditionConcerns || ''}
              onChange={(e) => setFeedback({ ...feedback, conditionConcerns: e.target.value })}
              className="resize-none"
              rows={2}
            />
          </div>

          {/* Next Step */}
          <div className="space-y-2">
            <Label>Next step?</Label>
            <RadioGroup
              value={feedback.nextStep || ''}
              onValueChange={(v) => setFeedback({ ...feedback, nextStep: v as FeedbackData['nextStep'] })}
              className="grid grid-cols-2 gap-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="see_again" id="next-see" />
                <Label htmlFor="next-see" className="font-normal cursor-pointer">See it again</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="keep_looking" id="next-keep" />
                <Label htmlFor="next-keep" className="font-normal cursor-pointer">Keep looking</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="write_offer" id="next-offer" />
                <Label htmlFor="next-offer" className="font-normal cursor-pointer">Write offer!</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="sleep_on_it" id="next-sleep" />
                <Label htmlFor="next-sleep" className="font-normal cursor-pointer">Sleep on it</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Investigate request */}
          <div className="space-y-2">
            <Label htmlFor="investigateRequest">Anything you want me to investigate?</Label>
            <Textarea
              id="investigateRequest"
              placeholder="HOA fees, roof age, permits..."
              value={feedback.investigateRequest || ''}
              onChange={(e) => setFeedback({ ...feedback, investigateRequest: e.target.value })}
              className="resize-none"
              rows={2}
            />
          </div>
        </div>

        <Button onClick={handleSubmit} disabled={saving} className="w-full">
          {saving ? 'Saving...' : 'Submit Feedback'}
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default PropertyFeedbackDialog;
