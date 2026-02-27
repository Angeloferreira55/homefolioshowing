import { useState, useEffect } from 'react';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription,
} from '@/components/ui/responsive-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, Loader2, Lock, RefreshCw, Users, X, Gift } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';

interface AgentOption {
  id: string;
  full_name: string;
  avatar_url: string | null;
}

interface SessionData {
  id: string;
  title: string;
  client_name: string;
  client_email?: string | null;
  client_phone?: string | null;
  session_date?: string | null;
  notes?: string | null;
  share_password?: string | null;
  agent_profile_id?: string | null;
  session_type?: string | null;
  gift_label?: string | null;
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
    agentProfileId?: string | null;
    giftLabel?: string;
  }) => Promise<void>;
  agentProfiles?: AgentOption[];
}

const generateAccessCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars like 0, O, 1, I
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

const EditSessionDialog = ({ session, open, onOpenChange, onSave, agentProfiles }: EditSessionDialogProps) => {
  const [title, setTitle] = useState('');
  const [clientName, setClientName] = useState('');
  const [sessionDate, setSessionDate] = useState<Date | undefined>();
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [accessCodeEnabled, setAccessCodeEnabled] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [giftLabel, setGiftLabel] = useState('');
  const hasAgents = agentProfiles && agentProfiles.length > 0;
  const isPopBy = session?.session_type === 'pop_by';

  useEffect(() => {
    if (session) {
      setTitle(session.title || '');
      setClientName(session.client_name || '');
      // Parse date string as local date to avoid timezone shift
      if (session.session_date) {
        const [year, month, day] = session.session_date.split('-').map(Number);
        setSessionDate(new Date(year, month - 1, day));
      } else {
        setSessionDate(undefined);
      }
      setNotes(session.notes || '');
      setAccessCodeEnabled(!!session.share_password);
      setAccessCode(session.share_password || '');
      setSelectedAgentId(session.agent_profile_id || null);
      setGiftLabel(session.gift_label || '');
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
        agentProfileId: hasAgents ? selectedAgentId : undefined,
        giftLabel: isPopBy ? giftLabel.trim() || undefined : undefined,
      });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-md">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Edit Session</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Update the session details below.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Agent selector - only shown for Assistant tier with agent profiles */}
          {hasAgents && (
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                Session For
              </Label>
              <Select
                value={selectedAgentId || '_none'}
                onValueChange={(val) => setSelectedAgentId(val === '_none' ? null : val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an agent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">My Own Sessions</SelectItem>
                  {agentProfiles!.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

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

          {/* Gift / Item Label — Pop-By only */}
          {isPopBy && (
          <div className="space-y-2">
            <Label htmlFor="edit-gift-label" className="flex items-center gap-1.5">
              <Gift className="w-4 h-4" />
              Gift / Item
            </Label>
            <Input
              id="edit-gift-label"
              value={giftLabel}
              onChange={(e) => setGiftLabel(e.target.value)}
              placeholder="Valentine's Cookies, Market Update Packet..."
              maxLength={100}
            />
          </div>
          )}

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
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
};

export default EditSessionDialog;
