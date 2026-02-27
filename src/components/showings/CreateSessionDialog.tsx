import { useState } from 'react';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/ui/responsive-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, RefreshCw, Lock, LockOpen, Users, Gift } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { sessionSchema } from '@/lib/validations';
import { z } from 'zod';
import { Switch } from '@/components/ui/switch';

interface AgentOption {
  id: string;
  full_name: string;
  avatar_url: string | null;
}

interface CreateSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (data: {
    title: string;
    sessionDate?: Date;
    clientName: string;
    notes?: string;
    sharePassword?: string;
    agentProfileId?: string | null;
    sessionType?: string;
    giftLabel?: string;
  }) => void;
  isOnboarding?: boolean;
  agentProfiles?: AgentOption[];
  sessionType?: string;
  defaultAgentId?: string | null;
}

const generateAccessCode = (): string => {
  // Generate a 6-character alphanumeric code (easy to read/type)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluded I, O, 0, 1 for clarity
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

const CreateSessionDialog = ({ open, onOpenChange, onCreate, isOnboarding = false, agentProfiles, sessionType = 'home_folio', defaultAgentId }: CreateSessionDialogProps) => {
  const [title, setTitle] = useState('');
  const [sessionDate, setSessionDate] = useState<Date>();
  const [clientName, setClientName] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [passwordEnabled, setPasswordEnabled] = useState(false);
  const [sharePassword, setSharePassword] = useState('');
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(defaultAgentId ?? null);
  const [giftLabel, setGiftLabel] = useState('');
  const hasAgents = agentProfiles && agentProfiles.length > 0;

  // Sync default agent when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedAgentId(defaultAgentId ?? null);
    }
  }, [open, defaultAgentId]);

  // Mark field as touched when user interacts with it
  const handleFieldFocus = (fieldName: string) => {
    if (isOnboarding) {
      setTouchedFields(prev => new Set(prev).add(fieldName));
    }
  };

  // Helper to get highlight class for required fields during onboarding
  const getRequiredFieldClass = (fieldName: string, fieldValue: string) => {
    if (!isOnboarding) return '';
    // Remove highlight only if field has been touched (not based on content)
    if (touchedFields.has(fieldName)) {
      return '';
    }
    return 'border-2 border-primary bg-primary/5 shadow-[0_0_15px_rgba(var(--primary),0.3)]';
  };

  const isPopBy = sessionType === 'pop_by';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate form data — pop-by skips clientName requirement
    try {
      sessionSchema.parse({
        title: title.trim(),
        clientName: isPopBy ? 'Pop-By' : clientName.trim(),
        notes: notes.trim() || undefined,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
        return;
      }
    }

    onCreate({
      title: title.trim(),
      sessionDate,
      clientName: isPopBy ? 'Pop-By' : clientName.trim(),
      notes: isPopBy ? undefined : (notes.trim() || undefined),
      sharePassword: passwordEnabled && sharePassword ? sharePassword : undefined,
      agentProfileId: hasAgents ? selectedAgentId : undefined,
      sessionType,
      giftLabel: isPopBy && giftLabel.trim() ? giftLabel.trim() : undefined,
    });
    resetForm();
    onOpenChange(false);
  };

  const resetForm = () => {
    setTitle('');
    setSessionDate(undefined);
    setClientName('');
    setNotes('');
    setErrors({});
    setPasswordEnabled(false);
    setSharePassword('');
    setDatePickerOpen(false);
    setTouchedFields(new Set());
    setSelectedAgentId(null);
    setGiftLabel('');
  };

  const handleGenerateCode = () => {
    setSharePassword(generateAccessCode());
  };

  const handlePasswordToggle = (enabled: boolean) => {
    setPasswordEnabled(enabled);
    if (enabled && !sharePassword) {
      handleGenerateCode();
    }
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetForm();
      onOpenChange(isOpen);
    }}>
      <ResponsiveDialogContent className="sm:max-w-lg">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle className="font-display text-2xl">
            {sessionType === 'pop_by' ? 'Create Pop-By Folio' : 'Create Showing Session'}
          </ResponsiveDialogTitle>
        </ResponsiveDialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          {/* Agent selector - only shown for Assistant tier with agent profiles */}
          {hasAgents && (
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                Create Session For
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
              <p className="text-xs text-muted-foreground">
                The selected agent's branding will appear on the shared link.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title" className={isOnboarding ? 'text-primary font-semibold' : ''}>
              Session Title {isOnboarding && <span className="text-primary">*</span>}
            </Label>
            <Input
              id="title"
              placeholder="Saturday Home Tour - North Valley"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onFocus={() => handleFieldFocus('title')}
              maxLength={200}
              required
              className={getRequiredFieldClass('title', title)}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Session Date</Label>
            <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !sessionDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {sessionDate ? format(sessionDate, "PPP") : "mm/dd/yyyy"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={sessionDate}
                  onSelect={(date) => {
                    setSessionDate(date);
                    setDatePickerOpen(false);
                  }}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Gift / Item Label — Pop-By only */}
          {isPopBy && (
          <div className="space-y-2">
            <Label htmlFor="giftLabel" className="flex items-center gap-1.5">
              <Gift className="w-4 h-4" />
              Gift / Item
            </Label>
            <Input
              id="giftLabel"
              placeholder="Valentine's Cookies, Market Update Packet..."
              value={giftLabel}
              onChange={(e) => setGiftLabel(e.target.value)}
              maxLength={100}
            />
            <p className="text-xs text-muted-foreground">
              What you're delivering. Shown on the delivery view.
            </p>
          </div>
          )}

          {/* Client Name — hidden for Pop-By */}
          {!isPopBy && (
          <div className="space-y-2">
            <Label htmlFor="clientName" className={isOnboarding ? 'text-primary font-semibold' : ''}>
              Client Name {isOnboarding && <span className="text-primary">*</span>}
            </Label>
            <Input
              id="clientName"
              placeholder="John & Jane Smith"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              onFocus={() => handleFieldFocus('clientName')}
              maxLength={100}
              required
              className={getRequiredFieldClass('clientName', clientName)}
            />
            {errors.clientName && (
              <p className="text-sm text-destructive">{errors.clientName}</p>
            )}
          </div>
          )}

          {/* Session Notes — hidden for Pop-By */}
          {!isPopBy && (
          <div className="space-y-2">
            <Label htmlFor="notes">Session Notes (visible to client)</Label>
            <Textarea
              id="notes"
              placeholder="We're looking at 4 homes today in the $400-500k range..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              maxLength={1000}
            />
            {errors.notes && (
              <p className="text-sm text-destructive">{errors.notes}</p>
            )}
          </div>
          )}

          {/* Password Protection Section */}
          <div className={`border rounded-lg p-4 space-y-3 bg-muted/30 ${
            isOnboarding ? 'border-2 border-amber-500 bg-amber-500/10' : ''
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {passwordEnabled ? (
                  <Lock className="w-4 h-4 text-primary" />
                ) : (
                  <LockOpen className="w-4 h-4 text-muted-foreground" />
                )}
                <Label htmlFor="password-toggle" className="font-medium cursor-pointer">
                  Password Protect Link {isOnboarding && <span className="text-amber-600">(Recommended)</span>}
                </Label>
              </div>
              <Switch
                id="password-toggle"
                checked={passwordEnabled}
                onCheckedChange={handlePasswordToggle}
              />
            </div>
            {isOnboarding && !passwordEnabled && (
              <p className="text-xs text-amber-600 dark:text-amber-500">
                💡 Tip: We highly recommend enabling password protection to keep your client's showing session private and secure.
              </p>
            )}
            
            {passwordEnabled && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={sharePassword}
                    onChange={(e) => setSharePassword(e.target.value.toUpperCase())}
                    placeholder="Access code"
                    className="font-mono text-center tracking-widest uppercase"
                    maxLength={20}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleGenerateCode}
                    title="Generate new code"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Share this code with your client. They'll need it to access the portfolio.
                </p>
              </div>
            )}
          </div>

          <Button
            type="submit"
            className="w-full h-12 bg-primary text-primary-foreground font-semibold uppercase tracking-wide"
          >
            Create Session
          </Button>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
};

export default CreateSessionDialog;
