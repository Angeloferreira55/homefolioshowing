import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Play, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DemoVideoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DemoVideoDialog({ open, onOpenChange }: DemoVideoDialogProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const handleClose = () => {
    setIsPlaying(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-background/95 backdrop-blur-lg border-border/50">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="font-display text-2xl text-center">
            See HomeFolio In Action
          </DialogTitle>
        </DialogHeader>
        
        <div className="p-6">
          <AspectRatio ratio={16 / 9} className="bg-muted rounded-lg overflow-hidden">
            {/* Placeholder video area - replace with actual video */}
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-primary/20 via-background to-accent/20 relative">
              {!isPlaying ? (
                <>
                  {/* Animated background elements */}
                  <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-primary/10 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-accent/10 rounded-full blur-3xl animate-pulse delay-700" />
                  </div>
                  
                  {/* Play button */}
                  <button
                    onClick={() => setIsPlaying(true)}
                    className="relative z-10 w-20 h-20 rounded-full bg-primary flex items-center justify-center shadow-lg hover:scale-110 transition-transform group"
                  >
                    <Play className="w-8 h-8 text-primary-foreground ml-1 group-hover:scale-110 transition-transform" />
                  </button>
                  
                  <p className="relative z-10 mt-6 text-muted-foreground text-center max-w-md px-4">
                    Watch how HomeFolio transforms your client experience
                  </p>
                </>
              ) : (
                /* Video placeholder - replace src with actual video URL */
                <div className="w-full h-full flex flex-col items-center justify-center text-center p-8">
                  <div className="space-y-6 max-w-lg animate-fade-in">
                    <h3 className="text-xl font-semibold text-foreground">
                      🎬 Demo Video Coming Soon
                    </h3>
                    <div className="space-y-4 text-left text-muted-foreground">
                      <p className="flex items-start gap-3">
                        <span className="text-primary font-bold">1.</span>
                        <span><strong>One Link Per Client</strong> — Create a private, shareable link for each buyer</span>
                      </p>
                      <p className="flex items-start gap-3">
                        <span className="text-primary font-bold">2.</span>
                        <span><strong>Real-Time Updates</strong> — Add or remove properties instantly, no re-sending</span>
                      </p>
                      <p className="flex items-start gap-3">
                        <span className="text-primary font-bold">3.</span>
                        <span><strong>Route Optimization</strong> — Plan efficient showing tours automatically</span>
                      </p>
                      <p className="flex items-start gap-3">
                        <span className="text-primary font-bold">4.</span>
                        <span><strong>Client Feedback</strong> — Capture ratings and notes after each showing</span>
                      </p>
                    </div>
                    <p className="text-sm text-primary font-medium pt-4">
                      Save time. Impress buyers. Close faster.
                    </p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setIsPlaying(false)}
                    className="mt-6"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Close Preview
                  </Button>
                </div>
              )}
            </div>
          </AspectRatio>
          
          {/* Value propositions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold text-primary">50%</p>
              <p className="text-sm text-muted-foreground">Less time on admin</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold text-primary">1 Link</p>
              <p className="text-sm text-muted-foreground">Always up to date</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold text-primary">Pro Look</p>
              <p className="text-sm text-muted-foreground">Impress every client</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
