import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, PlayCircle, Rocket, X, Loader2 } from 'lucide-react';

interface WelcomeModalProps {
  open: boolean;
  onTakeTour: () => void;
  onCreateDemo: () => void;
  onSkip: () => void;
  isCreatingDemo?: boolean;
  userName?: string;
}

function WelcomeModal({
  open,
  onTakeTour,
  onCreateDemo,
  onSkip,
  isCreatingDemo = false,
  userName,
}: WelcomeModalProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onSkip()}>
      <DialogContent className="sm:max-w-[600px]">
        <button
          onClick={onSkip}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>

        <DialogHeader className="space-y-3">
          <div className="flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
          </div>
          <DialogTitle className="font-display text-3xl text-center">
            Welcome to HomeFolio! 👋
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            {userName ? `Hi ${userName}! ` : ''}
            Let's get you started with creating amazing property showings for your clients.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-6">
          {/* Quick Tour Option */}
          <button
            onClick={onTakeTour}
            className="w-full p-4 border-2 border-primary bg-primary/5 rounded-xl hover:bg-primary/10 transition-all text-left group"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-500/20 transition-colors">
                <PlayCircle className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1">
                  Take a Quick Tour
                </h3>
                <p className="text-sm text-muted-foreground">
                  2-minute guided walkthrough of key features and how to create your first showing session.
                </p>
              </div>
            </div>
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={onSkip}
            className="w-full"
          >
            Skip - I'll figure it out myself
          </Button>
        </div>

        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground text-center">
            💡 You can always access help from the menu or restart the tour from your profile settings
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default WelcomeModal;
