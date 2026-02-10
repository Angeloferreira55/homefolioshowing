import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Gift, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface RedeemBetaCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRedeem: (code: string) => Promise<unknown>;
}

const RedeemBetaCodeDialog = ({ open, onOpenChange, onRedeem }: RedeemBetaCodeDialogProps) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    try {
      await onRedeem(code.trim());
      toast.success('Beta code redeemed! Enjoy your free Pro access 🎉');
      setCode('');
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to redeem code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <Gift className="w-5 h-5 text-accent" />
            </div>
            <div>
              <DialogTitle>Redeem Beta Code</DialogTitle>
              <DialogDescription>
                Enter your invite code to unlock free Pro access
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="beta-code">Invite Code</Label>
            <Input
              id="beta-code"
              placeholder="Enter your code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="h-12 text-center text-lg font-mono tracking-widest uppercase"
              maxLength={20}
              autoFocus
            />
          </div>

          <Button
            type="submit"
            variant="accent"
            className="w-full"
            size="lg"
            disabled={loading || !code.trim()}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            {loading ? 'Redeeming...' : 'Redeem Code'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RedeemBetaCodeDialog;
