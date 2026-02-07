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
import { CalendarIcon, RefreshCw, Lock, LockOpen } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { sessionSchema } from '@/lib/validations';
import { z } from 'zod';
import { Switch } from '@/components/ui/switch';

interface CreateSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (data: {
    title: string;
    sessionDate?: Date;
    clientName: string;
    notes?: string;
    sharePassword?: string;
  }) => void;
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

const CreateSessionDialog = ({ open, onOpenChange, onCreate }: CreateSessionDialogProps) => {
  const [title, setTitle] = useState('');
  const [sessionDate, setSessionDate] = useState<Date>();
  const [clientName, setClientName] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [passwordEnabled, setPasswordEnabled] = useState(false);
  const [sharePassword, setSharePassword] = useState('');
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate form data
    try {
      sessionSchema.parse({
        title: title.trim(),
        clientName: clientName.trim(),
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
      clientName: clientName.trim(),
      notes: notes.trim() || undefined,
      sharePassword: passwordEnabled && sharePassword ? sharePassword : undefined,
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
            Create Showing Session
          </ResponsiveDialogTitle>
        </ResponsiveDialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          <div className="space-y-2">
            <Label htmlFor="title">Session Title *</Label>
            <Input
              id="title"
              placeholder="Saturday Home Tour - North Valley"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              required
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

          <div className="space-y-2">
            <Label htmlFor="clientName">Client Name *</Label>
            <Input
              id="clientName"
              placeholder="John & Jane Smith"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              maxLength={100}
              required
            />
            {errors.clientName && (
              <p className="text-sm text-destructive">{errors.clientName}</p>
            )}
          </div>


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

          {/* Password Protection Section */}
          <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {passwordEnabled ? (
                  <Lock className="w-4 h-4 text-primary" />
                ) : (
                  <LockOpen className="w-4 h-4 text-muted-foreground" />
                )}
                <Label htmlFor="password-toggle" className="font-medium cursor-pointer">
                  Password Protect Link
                </Label>
              </div>
              <Switch
                id="password-toggle"
                checked={passwordEnabled}
                onCheckedChange={handlePasswordToggle}
              />
            </div>
            
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
