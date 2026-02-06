import { useState, useRef } from 'react';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/ui/responsive-dialog';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import demoVideo from '@/assets/homefolio-demo.mp4';

interface DemoVideoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DemoVideoDialog({ open, onOpenChange }: DemoVideoDialogProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleClose = () => {
    setIsPlaying(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    onOpenChange(false);
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={handleClose}>
      <ResponsiveDialogContent className="max-w-4xl p-0 overflow-hidden bg-background/95 backdrop-blur-lg border-border/50">
        <ResponsiveDialogHeader className="p-6 pb-0">
          <ResponsiveDialogTitle className="font-display text-2xl text-center">
            See HomeFolio In Action
          </ResponsiveDialogTitle>
        </ResponsiveDialogHeader>
        
        <div className="p-6">
          <AspectRatio ratio={16 / 9} className="bg-muted rounded-lg overflow-hidden">
            <div className="w-full h-full relative group">
              <video
                ref={videoRef}
                src={demoVideo}
                className="w-full h-full object-cover"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
                playsInline
              />
              
              {/* Play/Pause overlay */}
              <div 
                className={`absolute inset-0 flex items-center justify-center bg-black/30 transition-opacity cursor-pointer ${isPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}
                onClick={togglePlay}
              >
                <button className="w-20 h-20 rounded-full bg-primary/90 flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                  {isPlaying ? (
                    <Pause className="w-8 h-8 text-primary-foreground" />
                  ) : (
                    <Play className="w-8 h-8 text-primary-foreground ml-1" />
                  )}
                </button>
              </div>

              {/* Mute button */}
              <button
                onClick={toggleMute}
                className="absolute bottom-4 right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
              >
                {isMuted ? (
                  <VolumeX className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </button>
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
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
