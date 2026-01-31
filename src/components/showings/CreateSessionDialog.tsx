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

interface CreateSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (data: {
    title: string;
    sessionDate?: Date;
    clientName: string;
    clientEmail?: string;
    clientPhone?: string;
    notes?: string;
  }) => void;
}

const CreateSessionDialog = ({ open, onOpenChange, onCreate }: CreateSessionDialogProps) => {
  const [title, setTitle] = useState('');
  const [sessionDate, setSessionDate] = useState<Date>();
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && clientName.trim()) {
      onCreate({
        title: title.trim(),
        sessionDate,
        clientName: clientName.trim(),
        clientEmail: clientEmail.trim() || undefined,
        clientPhone: clientPhone.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      resetForm();
      onOpenChange(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setSessionDate(undefined);
    setClientName('');
    setClientEmail('');
    setClientPhone('');
    setNotes('');
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
              required
            />
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
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clientEmail">Client Email</Label>
              <Input
                id="clientEmail"
                type="email"
                placeholder="client@email.com"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientPhone">Client Phone</Label>
              <Input
                id="clientPhone"
                type="tel"
                placeholder="505-555-1234"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Session Notes (visible to client)</Label>
            <Textarea
              id="notes"
              placeholder="We're looking at 4 homes today in the $400-500k range..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
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
