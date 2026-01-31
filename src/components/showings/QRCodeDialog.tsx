import { useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
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
  const shareUrl = `${window.location.origin}/s/${shareToken}`;

  useEffect(() => {
    if (open && canvasRef.current) {
      generateQRCode();
    }
  }, [open, shareToken]);

  const generateQRCode = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Simple QR-like pattern (placeholder - in production use a QR library)
    const size = 200;
    canvas.width = size;
    canvas.height = size;

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, size, size);

    ctx.fillStyle = 'black';
    const cellSize = 10;
    const margin = 20;

    // Draw a placeholder pattern
    const data = shareToken;
    for (let i = 0; i < (size - margin * 2) / cellSize; i++) {
      for (let j = 0; j < (size - margin * 2) / cellSize; j++) {
        const charCode = data.charCodeAt((i * j) % data.length);
        if ((charCode + i + j) % 3 === 0) {
          ctx.fillRect(
            margin + i * cellSize,
            margin + j * cellSize,
            cellSize - 1,
            cellSize - 1
          );
        }
      }
    }

    // Corner patterns
    const corners = [
      [margin, margin],
      [size - margin - 30, margin],
      [margin, size - margin - 30],
    ];
    
    corners.forEach(([x, y]) => {
      ctx.fillStyle = 'black';
      ctx.fillRect(x, y, 30, 30);
      ctx.fillStyle = 'white';
      ctx.fillRect(x + 5, y + 5, 20, 20);
      ctx.fillStyle = 'black';
      ctx.fillRect(x + 10, y + 10, 10, 10);
    });
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
        </DialogHeader>

        <div className="flex flex-col items-center py-6">
          <div className="bg-white p-4 rounded-xl shadow-md mb-4">
            <canvas ref={canvasRef} className="w-[200px] h-[200px]" />
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
