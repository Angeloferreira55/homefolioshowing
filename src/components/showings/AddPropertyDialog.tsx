import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Link2, Loader2 } from 'lucide-react';

interface AddPropertyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (data: {
    address: string;
    city?: string;
    state?: string;
    zipCode?: string;
    price?: number;
    photoUrl?: string;
    beds?: number;
    baths?: number;
    sqft?: number;
  }) => void;
}

const AddPropertyDialog = ({ open, onOpenChange, onAdd }: AddPropertyDialogProps) => {
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [price, setPrice] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [beds, setBeds] = useState('');
  const [baths, setBaths] = useState('');
  const [sqft, setSqft] = useState('');

  const [listingUrl, setListingUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  const handleImportFromUrl = async () => {
    if (!listingUrl.trim()) {
      toast.error('Please enter a listing URL');
      return;
    }

    setIsImporting(true);
    try {
      const { data, error } = await supabase.functions.invoke('scrape-listing', {
        body: { url: listingUrl.trim() },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to import listing');
      }

      const property = data.data;

      // Auto-fill the form fields
      if (property.address) setAddress(property.address);
      if (property.city) setCity(property.city);
      if (property.state) setState(property.state);
      if (property.zipCode) setZipCode(property.zipCode);
      if (property.price) setPrice(property.price.toString());
      if (property.photoUrl) setPhotoUrl(property.photoUrl);
      if (property.beds) setBeds(property.beds.toString());
      if (property.baths) setBaths(property.baths.toString());
      if (property.sqft) setSqft(property.sqft.toString());

      toast.success('Listing data imported! Review and submit.');
    } catch (error: any) {
      console.error('Import error:', error);
      toast.error(error.message || 'Failed to import listing data');
    } finally {
      setIsImporting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (address.trim()) {
      onAdd({
        address: address.trim(),
        city: city.trim() || undefined,
        state: state.trim() || undefined,
        zipCode: zipCode.trim() || undefined,
        price: price ? parseFloat(price.replace(/[^0-9.]/g, '')) : undefined,
        photoUrl: photoUrl.trim() || undefined,
        beds: beds ? parseInt(beds) : undefined,
        baths: baths ? parseFloat(baths) : undefined,
        sqft: sqft ? parseInt(sqft) : undefined,
      });
      resetForm();
      onOpenChange(false);
    }
  };

  const resetForm = () => {
    setAddress('');
    setCity('');
    setState('');
    setZipCode('');
    setPrice('');
    setPhotoUrl('');
    setBeds('');
    setBaths('');
    setSqft('');
    setListingUrl('');
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetForm();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            Add Property
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="manual" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
            <TabsTrigger value="import">Import from URL</TabsTrigger>
          </TabsList>

          <TabsContent value="import" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="listingUrl">Listing URL</Label>
              <div className="flex gap-2">
                <Input
                  id="listingUrl"
                  placeholder="https://zillow.com/... or redfin.com/..."
                  value={listingUrl}
                  onChange={(e) => setListingUrl(e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={handleImportFromUrl}
                  disabled={isImporting}
                  className="gap-2"
                >
                  {isImporting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Link2 className="w-4 h-4" />
                  )}
                  {isImporting ? 'Importing...' : 'Import'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Paste a link from Zillow, Redfin, Realtor.com, or any MLS listing
              </p>
            </div>

            {address && (
              <div className="p-3 bg-muted rounded-lg text-sm">
                <p className="font-medium">Imported: {address}</p>
                {city && state && <p className="text-muted-foreground">{city}, {state} {zipCode}</p>}
                {price && <p className="text-accent font-medium">${Number(price).toLocaleString()}</p>}
              </div>
            )}
          </TabsContent>

          <TabsContent value="manual" className="mt-4">
            {/* Form is shared between tabs */}
          </TabsContent>
        </Tabs>

        <form onSubmit={handleSubmit} className="space-y-5 mt-2">
          <div className="space-y-2">
            <Label htmlFor="address">Street Address *</Label>
            <Input
              id="address"
              placeholder="123 Main Street"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                placeholder="Albuquerque"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                placeholder="NM"
                value={state}
                onChange={(e) => setState(e.target.value)}
                maxLength={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zipCode">ZIP Code</Label>
              <Input
                id="zipCode"
                placeholder="87101"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                placeholder="$500,000"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="beds">Beds</Label>
              <Input
                id="beds"
                placeholder="3"
                value={beds}
                onChange={(e) => setBeds(e.target.value)}
                type="number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="baths">Baths</Label>
              <Input
                id="baths"
                placeholder="2"
                value={baths}
                onChange={(e) => setBaths(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sqft">Sqft</Label>
              <Input
                id="sqft"
                placeholder="1,800"
                value={sqft}
                onChange={(e) => setSqft(e.target.value)}
                type="number"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="photoUrl">Photo URL</Label>
            <Input
              id="photoUrl"
              placeholder="https://..."
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
            />
          </div>

          <Button
            type="submit"
            className="w-full h-12 bg-primary text-primary-foreground font-semibold uppercase tracking-wide"
          >
            Add Property
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddPropertyDialog;
