import { useState } from 'react';
import { ClientType } from '@/types/homefolio';
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
import { Users, Home, TrendingUp } from 'lucide-react';

interface CreateClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (data: { name: string; nickname?: string; type: ClientType }) => void;
}

const clientTypes: { value: ClientType; label: string; icon: typeof Users }[] = [
  { value: 'buyer', label: 'Buyer', icon: Users },
  { value: 'seller', label: 'Seller', icon: Home },
  { value: 'investor', label: 'Investor', icon: TrendingUp },
];

const CreateClientDialog = ({ open, onOpenChange, onCreate }: CreateClientDialogProps) => {
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [clientType, setClientType] = useState<ClientType>('buyer');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onCreate({
        name: name.trim(),
        nickname: nickname.trim() || undefined,
        type: clientType,
      });
      setName('');
      setNickname('');
      setClientType('buyer');
      onOpenChange(false);
    }
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-md">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle className="font-display text-2xl">Create Client Homefolio</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Start a new property collection for your client. A unique private link will be generated automatically.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Client Name *</Label>
            <Input
              id="name"
              placeholder="e.g., John & Jane Smith"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nickname">Nickname (optional)</Label>
            <Input
              id="nickname"
              placeholder="e.g., The Smith Family"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
          </div>

          <div className="space-y-3">
            <Label>Client Type</Label>
            <div className="grid grid-cols-3 gap-3">
              {clientTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setClientType(type.value)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    clientType === type.value
                      ? 'border-accent bg-accent/5'
                      : 'border-border hover:border-muted-foreground/30'
                  }`}
                >
                  <type.icon className={`w-5 h-5 ${
                    clientType === type.value ? 'text-accent' : 'text-muted-foreground'
                  }`} />
                  <span className={`text-sm font-medium ${
                    clientType === type.value ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {type.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="accent">
              Create Homefolio
            </Button>
          </div>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
};

export default CreateClientDialog;
