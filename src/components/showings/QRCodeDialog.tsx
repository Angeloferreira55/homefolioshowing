import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface QRCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shareToken: string;
  sessionTitle: string;
}

const QRCodeDialog = ({ open, onOpenChange, shareToken, sessionTitle }: QRCodeDialogProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const shareUrl = `${window.location.origin}/s/${shareToken}`;

  useEffect(() => {
    if (open && canvasRef.current && shareToken) {
      // Small delay to ensure canvas is mounted
      const timer = setTimeout(() => {
        generateQRCode();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [open, shareToken]);

  // Force regeneration when shareToken changes
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
      await QRCode.toCanvas(canvas, shareUrl, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'M',
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-center">
            Share Session
          </DialogTitle>
          <DialogDescription className="text-center text-sm text-muted-foreground">
            Scan QR code or copy the link to share "{sessionTitle}" with your client
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center py-6">
          <div className="bg-white p-4 rounded-xl shadow-md mb-4">
            {error ? (
              <div className="w-[200px] h-[200px] flex items-center justify-center text-destructive text-sm">
                {error}
              </div>
            ) : (
              <canvas ref={canvasRef} className="w-[200px] h-[200px]" />
            )}
          </div>

          <p className="text-sm text-muted-foreground text-center mb-4 px-4 break-all">
            {shareUrl}
          </p>

          <div className="flex gap-3 w-full">
            <Button variant="outline" className="flex-1 gap-2" onClick={handleCopyLink}>
              <Copy className="w-4 h-4" />
              Copy Link
            </Button>
            <Button variant="outline" className="flex-1 gap-2" onClick={handleDownload}>
              <Download className="w-4 h-4" />
              Download
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QRCodeDialog;
