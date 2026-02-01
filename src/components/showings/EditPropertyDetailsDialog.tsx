import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Sparkles, Home, MessageSquare } from 'lucide-react';

interface EditPropertyDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  propertyAddress: string;
  onSaved?: () => void;
}

const EditPropertyDetailsDialog = ({
  open,
  onOpenChange,
  propertyId,
  propertyAddress,
  onSaved,
}: EditPropertyDetailsDialogProps) => {
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [agentNotes, setAgentNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && propertyId) {
      fetchPropertyDetails();
    }
  }, [open, propertyId]);

  const fetchPropertyDetails = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('session_properties')
        .select('summary, description, agent_notes')
        .eq('id', propertyId)
        .single();

      if (error) throw error;

      setSummary(data?.summary || '');
      setDescription(data?.description || '');
      setAgentNotes(data?.agent_notes || '');
    } catch (error) {
      console.error('Error fetching property details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('session_properties')
        .update({
          summary: summary.trim() || null,
          description: description.trim() || null,
          agent_notes: agentNotes.trim() || null,
        })
        .eq('id', propertyId);

      if (error) throw error;

      toast.success('Property details saved!');
      onSaved?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving property details:', error);
      toast.error(error.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            Edit Property Details
          </DialogTitle>
          <p className="text-sm text-muted-foreground truncate">
            {propertyAddress}
          </p>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-5 mt-4">
            {/* Summary */}
            <div className="space-y-2">
              <Label htmlFor="summary" className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Summary
              </Label>
              <Textarea
                id="summary"
                placeholder="Brief highlights of this property..."
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={2}
              />
              <p className="text-xs text-muted-foreground">
                A short summary shown at the top of the property detail.
              </p>
            </div>

            {/* About This Home */}
            <div className="space-y-2">
              <Label htmlFor="description" className="flex items-center gap-2">
                <Home className="w-4 h-4 text-primary" />
                About This Home
              </Label>
              <Textarea
                id="description"
                placeholder="Detailed description of the property, neighborhood, features..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Full property description your client will see.
              </p>
            </div>

            {/* Agent's Notes */}
            <div className="space-y-2">
              <Label htmlFor="agentNotes" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary" />
                Agent's Notes
              </Label>
              <Textarea
                id="agentNotes"
                placeholder="Your personal notes for the client about this property..."
                value={agentNotes}
                onChange={(e) => setAgentNotes(e.target.value)}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Personal notes highlighted for your client.
              </p>
            </div>

            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full h-12"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                'Save Details'
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EditPropertyDetailsDialog;
