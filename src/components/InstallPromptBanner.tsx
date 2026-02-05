import { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import { useIsMobile } from '@/hooks/use-mobile';

export default function InstallPromptBanner() {
  const { isInstallable, isInstalled, install } = useInstallPrompt();
  const isMobile = useIsMobile();
  const [isDismissed, setIsDismissed] = useState(false);

  // Load dismissal state from localStorage
  useEffect(() => {
    const dismissed = localStorage.getItem('install-prompt-dismissed');
    if (dismissed) {
      setIsDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('install-prompt-dismissed', 'true');
  };

  const handleInstall = async () => {
    await install();
    // Reset dismissal state so banner shows again if install fails
    if (!isInstalled) {
      localStorage.removeItem('install-prompt-dismissed');
    }
  };

  // Only show on mobile, if installable, not installed, and not dismissed
  if (!isMobile || !isInstallable || isInstalled || isDismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground safe-area-bottom">
      <div className="container mx-auto px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Download className="w-5 h-5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="font-medium text-sm sm:text-base truncate">
                Add HomeFolio to your home screen
              </p>
              <p className="text-xs sm:text-sm text-primary-foreground/80 truncate">
                Quick access & offline browsing
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleInstall}
              className="bg-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/30"
            >
              Install
            </Button>
            <button
              onClick={handleDismiss}
              className="p-2 hover:bg-primary-foreground/20 rounded-lg transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
