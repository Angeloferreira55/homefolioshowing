import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2, Lock, RefreshCw, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';

interface SessionData {
  id: string;
  title: string;
  client_name: string;
  client_email?: string | null;
  client_phone?: string | null;
  session_date?: string | null;
  notes?: string | null;
  share_password?: string | null;
}

interface EditSessionDialogProps {
  session: SessionData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: {
    title: string;
    clientName: string;
    sessionDate?: Date;
    notes?: string;
    accessCode?: string | null;
  }) => Promise<void>;
}

const generateAccessCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars like 0, O, 1, I
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

const EditSessionDialog = ({ session, open, onOpenChange, onSave }: EditSessionDialogProps) => {
  const [title, setTitle] = useState('');
  const [clientName, setClientName] = useState('');
  const [sessionDate, setSessionDate] = useState<Date | undefined>();
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [accessCodeEnabled, setAccessCodeEnabled] = useState(false);
  const [accessCode, setAccessCode] = useState('');

  useEffect(() => {
    if (session) {
      setTitle(session.title || '');
      setClientName(session.client_name || '');
      setSessionDate(session.session_date ? new Date(session.session_date) : undefined);
      setNotes(session.notes || '');
      setAccessCodeEnabled(!!session.share_password);
      setAccessCode(session.share_password || '');
    }
  }, [session]);

  const handleAccessCodeToggle = (enabled: boolean) => {
    setAccessCodeEnabled(enabled);
    if (enabled && !accessCode) {
      setAccessCode(generateAccessCode());
    }
  };

  const handleRegenerateCode = () => {
    setAccessCode(generateAccessCode());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !clientName.trim()) return;

    setSaving(true);
    try {
      await onSave({
        title: title.trim(),
        clientName: clientName.trim(),
        sessionDate,
        notes: notes.trim() || undefined,
        accessCode: accessCodeEnabled ? accessCode : null,
      });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Session</DialogTitle>
          <DialogDescription>
            Update the session details below.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Session Title *</Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Home Tour - Johnson Family"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-date">Session Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !sessionDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {sessionDate ? format(sessionDate, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={sessionDate}
                  onSelect={setSessionDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-client-name">Client Name *</Label>
            <Input
              id="edit-client-name"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="e.g., John & Jane Johnson"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-notes">Notes</Label>
            <Textarea
              id="edit-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes about this session..."
              rows={3}
            />
          </div>

          {/* Access Code Section */}
          <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-muted-foreground" />
                <Label htmlFor="access-code-toggle" className="font-medium">
                  Require Access Code
                </Label>
              </div>
              <Switch
                id="access-code-toggle"
                checked={accessCodeEnabled}
                onCheckedChange={handleAccessCodeToggle}
              />
            </div>
            
            {accessCodeEnabled && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Clients will need this code to view the session.
                </p>
                <div className="flex gap-2">
                  <Input
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value.toUpperCase().slice(0, 6))}
                    placeholder="Access Code"
                    className="font-mono text-lg tracking-widest uppercase"
                    maxLength={6}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleRegenerateCode}
                    title="Generate new code"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !title.trim() || !clientName.trim()}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditSessionDialog;
