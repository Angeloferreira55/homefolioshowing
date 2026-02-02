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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, Copy, Palette, Image, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface QRCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shareToken: string;
  sessionTitle: string;
  logoUrl?: string | null;
}

const DEFAULT_COLORS = {
  foreground: '#1e3a5f', // Navy from design system
  background: '#ffffff',
};

// Higher resolution for better quality - displayed at 200px but rendered at 400px
const QR_RENDER_SIZE = 400;
const QR_DISPLAY_SIZE = 200;

const PRESET_COLORS = [
  { name: 'Navy', fg: '#1e3a5f', bg: '#ffffff' },
  { name: 'Terracotta', fg: '#c75d3a', bg: '#ffffff' },
  { name: 'Classic', fg: '#000000', bg: '#ffffff' },
  { name: 'Dark', fg: '#ffffff', bg: '#1e3a5f' },
  { name: 'Warm', fg: '#8b4513', bg: '#faf5f0' },
  { name: 'Modern', fg: '#333333', bg: '#f5f5f5' },
];

const QRCodeDialog = ({ open, onOpenChange, shareToken, sessionTitle, logoUrl }: QRCodeDialogProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [fgColor, setFgColor] = useState(DEFAULT_COLORS.foreground);
  const [bgColor, setBgColor] = useState(DEFAULT_COLORS.background);
  const [showLogo, setShowLogo] = useState(!!logoUrl);
  const [customLogoUrl, setCustomLogoUrl] = useState('');
  const shareUrl = `${window.location.origin}/s/${shareToken}`;

  const effectiveLogoUrl = customLogoUrl || logoUrl;

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
  }, [open, shareToken, fgColor, bgColor, showLogo, effectiveLogoUrl]);

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
      
      // Generate QR code at higher resolution for better quality
      await QRCode.toCanvas(canvas, shareUrl, {
        width: QR_RENDER_SIZE,
        margin: 2,
        color: {
          dark: fgColor,
          light: bgColor,
        },
        errorCorrectionLevel: showLogo && effectiveLogoUrl ? 'H' : 'M',
      });

      // Overlay logo if enabled
      if (showLogo && effectiveLogoUrl) {
        await overlayLogo(canvas, effectiveLogoUrl);
      }
    } catch (err) {
      console.error('QR generation error:', err);
      setError('Failed to generate QR code');
    }
  };

  const overlayLogo = async (canvas: HTMLCanvasElement, logoSrc: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      const logo = new window.Image();
      logo.crossOrigin = 'anonymous';
      
      logo.onload = () => {
        const logoSize = canvas.width * 0.25; // Logo takes 25% of QR code
        const x = (canvas.width - logoSize) / 2;
        const y = (canvas.height - logoSize) / 2;

        // Draw white background circle for logo
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2, logoSize / 2 + 4, 0, Math.PI * 2);
        ctx.fillStyle = bgColor;
        ctx.fill();

        // Draw logo (circular clip)
        ctx.save();
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2, logoSize / 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(logo, x, y, logoSize, logoSize);
        ctx.restore();

        resolve();
      };

      logo.onerror = () => {
        console.warn('Failed to load logo, continuing without it');
        resolve(); // Don't fail the whole QR code generation
      };

      logo.src = logoSrc;
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

  const applyPreset = (preset: typeof PRESET_COLORS[0]) => {
    setFgColor(preset.fg);
    setBgColor(preset.bg);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setCustomLogoUrl(result);
        setShowLogo(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearCustomLogo = () => {
    setCustomLogoUrl('');
    if (!logoUrl) {
      setShowLogo(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-center">
            Share Session
          </DialogTitle>
          <DialogDescription className="text-center text-sm text-muted-foreground">
            Customize and share "{sessionTitle}" with your client
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center py-4">
          {/* QR Code Preview */}
          <div className="bg-white p-4 rounded-xl shadow-md mb-4" style={{ backgroundColor: bgColor }}>
            {error ? (
              <div className="w-[200px] h-[200px] flex items-center justify-center text-destructive text-sm">
                {error}
              </div>
            ) : (
              <canvas 
                ref={canvasRef} 
                style={{ width: `${QR_DISPLAY_SIZE}px`, height: `${QR_DISPLAY_SIZE}px` }}
              />
            )}
          </div>

          {/* Customization Options */}
          <div className="flex gap-2 mb-4 w-full justify-center">
            {/* Color Picker */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Palette className="w-4 h-4" />
                  Colors
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72" align="center">
                <div className="space-y-4">
                  <div className="text-sm font-medium">Preset Colors</div>
                  <div className="grid grid-cols-3 gap-2">
                    {PRESET_COLORS.map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => applyPreset(preset)}
                        className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-muted transition-colors border border-transparent hover:border-border"
                      >
                        <div
                          className="w-8 h-8 rounded-md border shadow-sm"
                          style={{
                            background: `linear-gradient(135deg, ${preset.fg} 50%, ${preset.bg} 50%)`,
                          }}
                        />
                        <span className="text-xs text-muted-foreground">{preset.name}</span>
                      </button>
                    ))}
                  </div>

                  <div className="border-t pt-4 space-y-3">
                    <div className="text-sm font-medium">Custom Colors</div>
                    <div className="flex gap-4">
                      <div className="flex-1 space-y-1">
                        <Label className="text-xs text-muted-foreground">Foreground</Label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={fgColor}
                            onChange={(e) => setFgColor(e.target.value)}
                            className="w-8 h-8 rounded cursor-pointer border-0"
                          />
                          <Input
                            value={fgColor}
                            onChange={(e) => setFgColor(e.target.value)}
                            className="h-8 text-xs uppercase"
                          />
                        </div>
                      </div>
                      <div className="flex-1 space-y-1">
                        <Label className="text-xs text-muted-foreground">Background</Label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={bgColor}
                            onChange={(e) => setBgColor(e.target.value)}
                            className="w-8 h-8 rounded cursor-pointer border-0"
                          />
                          <Input
                            value={bgColor}
                            onChange={(e) => setBgColor(e.target.value)}
                            className="h-8 text-xs uppercase"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Logo Toggle */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Image className="w-4 h-4" />
                  Logo
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64" align="center">
                <div className="space-y-4">
                  <div className="text-sm font-medium">Add Logo to QR Code</div>
                  
                  {logoUrl && (
                    <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                      <img
                        src={logoUrl}
                        alt="Brokerage logo"
                        className="w-8 h-8 rounded object-cover"
                      />
                      <span className="text-xs flex-1">Brokerage Logo</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowLogo(!showLogo || !!customLogoUrl);
                          setCustomLogoUrl('');
                        }}
                        className="h-6 text-xs"
                      >
                        {showLogo && !customLogoUrl ? 'Remove' : 'Use'}
                      </Button>
                    </div>
                  )}

                  {customLogoUrl && (
                    <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                      <img
                        src={customLogoUrl}
                        alt="Custom logo"
                        className="w-8 h-8 rounded object-cover"
                      />
                      <span className="text-xs flex-1">Custom Logo</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearCustomLogo}
                        className="h-6 px-2"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  )}

                  <div className="border-t pt-4">
                    <Label className="text-xs text-muted-foreground mb-2 block">
                      Upload Custom Logo
                    </Label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="text-xs h-8"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Square images work best. Logo appears in center.
                    </p>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
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
