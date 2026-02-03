import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { sessionSchema } from '@/lib/validations';
import { z } from 'zod';

interface CreateSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (data: {
    title: string;
    sessionDate?: Date;
    clientName: string;
    notes?: string;
  }) => void;
}

const CreateSessionDialog = ({ open, onOpenChange, onCreate }: CreateSessionDialogProps) => {
  const [title, setTitle] = useState('');
  const [sessionDate, setSessionDate] = useState<Date>();
  const [clientName, setClientName] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

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
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetForm();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            Create Showing Session
          </DialogTitle>
        </DialogHeader>

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
            <Popover>
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
                  onSelect={setSessionDate}
                  initialFocus
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

          <Button
            type="submit"
            className="w-full h-12 bg-primary text-primary-foreground font-semibold uppercase tracking-wide"
          >
            Create Session
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateSessionDialog;
