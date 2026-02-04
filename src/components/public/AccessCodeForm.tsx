import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, AlertCircle } from 'lucide-react';
import logoImage from '@/assets/homefolio-logo.png';

interface AccessCodeFormProps {
  onSubmit: (code: string) => void;
  isLoading?: boolean;
  error?: string | null;
}

const AccessCodeForm = ({ onSubmit, isLoading, error }: AccessCodeFormProps) => {
  const [code, setCode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim()) {
      onSubmit(code.trim());
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="mb-6">
            <img 
              src={logoImage} 
              alt="HomeFolio" 
              className="h-16 w-auto mx-auto"
            />
          </div>
          <h1 className="font-display text-2xl font-semibold text-foreground mb-2">
            Enter Access Code
          </h1>
          <p className="text-muted-foreground">
            This property portfolio is protected. Please enter the access code provided by your agent.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="access-code" className="sr-only">Access Code</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="access-code"
                type="text"
                placeholder="Enter access code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="pl-10 h-12 text-center text-lg tracking-widest uppercase"
                autoComplete="off"
                autoFocus
                disabled={isLoading}
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 p-3 rounded-lg">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-12"
            disabled={!code.trim() || isLoading}
          >
            {isLoading ? 'Verifying...' : 'Access Portfolio'}
          </Button>
        </form>

        <p className="text-xs text-muted-foreground text-center mt-6">
          Don't have a code? Contact your real estate agent.
        </p>
      </div>
    </div>
  );
};

export default AccessCodeForm;
