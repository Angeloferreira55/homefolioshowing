import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription,
} from '@/components/ui/responsive-dialog';
import { Button } from '@/components/ui/button';
import { Download, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { getPublicShareOrigin } from '@/lib/publicShareOrigin';

interface QRCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shareToken: string;
  sessionTitle: string;
  logoUrl?: string | null;
  accessCode?: string | null;
}

// Standard QR code size for reliable scanning
const QR_RENDER_SIZE = 256;
const QR_DISPLAY_SIZE = 200;

const QRCodeDialog = ({ open, onOpenChange, shareToken, sessionTitle, accessCode }: QRCodeDialogProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const shareUrl = `${getPublicShareOrigin()}/s/${shareToken}`;

  useEffect(() => {
    if (open && shareToken) {
      // Wait for dialog to fully render before generating QR code
      const timer = setTimeout(() => {
        if (canvasRef.current) {
          generateQRCode();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [open, shareToken]);

  useEffect(() => {
    if (shareToken) {
      setError(null);
    }
  }, [shareToken]);

  const generateQRCode = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      setError(null);
      
      // Generate QR code with standard settings for reliable scanning
      await QRCode.toCanvas(canvas, shareUrl, {
        width: QR_RENDER_SIZE,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'M', // Medium error correction - good balance
      });
    } catch (err) {
      console.error('QR generation error:', err);
      setError('Failed to generate QR code');
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    toast.success('Link copied!');
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `${sessionTitle.replace(/\s+/g, '-')}-qr.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    toast.success('QR code downloaded!');
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-sm flex flex-col items-center">
        <ResponsiveDialogHeader className="w-full text-center">
          <ResponsiveDialogTitle className="font-display text-lg text-center">
            Share Session
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription className="text-center text-xs">
            Share "{sessionTitle}"
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <div className="flex flex-col items-center justify-center py-2 w-full max-w-[280px] mx-auto">
          {/* QR Code Preview */}
          <div className="p-4 rounded-lg bg-white shadow-sm mb-3 inline-flex items-center justify-center">
            {error ? (
              <div className="w-[200px] h-[200px] flex items-center justify-center text-destructive text-xs">
                {error}
              </div>
            ) : (
              <canvas 
                ref={canvasRef} 
                className="block"
                style={{ width: `${QR_DISPLAY_SIZE}px`, height: `${QR_DISPLAY_SIZE}px` }}
              />
            )}
          </div>

          {/* Access Code Display */}
          {accessCode && (
            <div className="w-full bg-muted/50 border border-border rounded-lg p-3 mb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Access Code</p>
                  <p className="font-mono text-lg font-bold tracking-widest text-foreground">
                    {accessCode}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(accessCode);
                    toast.success('Access code copied!');
                  }}
                  className="gap-1 h-7 text-xs"
                >
                  <Copy className="w-3 h-3" />
                  Copy
                </Button>
              </div>
            </div>
          )}

          <div className="flex gap-2 w-full">
            <Button variant="outline" size="sm" className="flex-1 gap-1.5 h-9" onClick={handleCopyLink}>
              <Copy className="w-3.5 h-3.5" />
              Copy Link
            </Button>
            <Button variant="outline" size="sm" className="flex-1 gap-1.5 h-9" onClick={handleDownload}>
              <Download className="w-3.5 h-3.5" />
              Download
            </Button>
          </div>
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
};

export default QRCodeDialog;
