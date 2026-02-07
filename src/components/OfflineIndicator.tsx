import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface OfflineIndicatorProps {
  showReconnectedToast?: boolean;
}

/**
 * Shows a banner when the user is offline and optionally 
 * shows a toast when they reconnect.
 */
const OfflineIndicator = ({ showReconnectedToast = true }: OfflineIndicatorProps) => {
  const { isOnline, wasOffline, resetWasOffline } = useNetworkStatus();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setIsVisible(true);
    } else if (wasOffline && showReconnectedToast) {
      toast.success('Back online!', {
        description: 'Your connection has been restored.',
        duration: 3000,
      });
      resetWasOffline();
      // Keep banner visible briefly for smooth transition
      setTimeout(() => setIsVisible(false), 500);
    } else {
      setIsVisible(false);
    }
  }, [isOnline, wasOffline, showReconnectedToast, resetWasOffline]);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-auto z-50 transition-all duration-300 ${
        isOnline ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
      }`}
    >
      <div className="bg-destructive text-destructive-foreground rounded-lg shadow-lg p-3 flex items-center gap-3">
        <WifiOff className="w-5 h-5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">You're offline</p>
          <p className="text-xs opacity-90">Changes will sync when you reconnect</p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => window.location.reload()}
          className="flex-shrink-0"
        >
          <RefreshCw className="w-4 h-4 mr-1" />
          Retry
        </Button>
      </div>
    </div>
  );
};

export default OfflineIndicator;
