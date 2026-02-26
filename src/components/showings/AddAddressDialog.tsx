import { useState, useRef } from 'react';
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
import { toast } from 'sonner';
import { Upload, FileText, X, MapPin } from 'lucide-react';

interface AddressData {
  address: string;
  city?: string;
  state?: string;
  zipCode?: string;
  recipientName?: string;
}

interface AddAddressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (data: AddressData) => void;
  onAddMultiple?: (data: AddressData[]) => void;
}

// Columns to ignore — never import these as address data
const SKIP_HEADERS = ['email', 'e-mail', 'phone', 'cell', 'mobile', 'fax', 'company', 'birthday', 'notes', 'tags', 'group', 'label', 'source'];

function looksLikeAddress(value: string): boolean {
  if (!value || value.length < 3) return false;
  // Must contain at least one digit (street number)
  if (!/\d/.test(value)) return false;
  // Reject if it looks like an email
  if (value.includes('@')) return false;
  // Reject if it looks like a phone number (mostly digits/dashes/parens)
  if (/^[\d\s\-().+]+$/.test(value)) return false;
  return true;
}

function parseCSV(text: string): { addresses: AddressData[]; skipped: number } {
  const lines = text.split(/\r?\n/).filter(line => line.trim());
  if (lines.length === 0) return { addresses: [], skipped: 0 };

  // Detect header row
  const firstLine = lines[0].toLowerCase();
  const hasHeader = firstLine.includes('address') || firstLine.includes('street') || firstLine.includes('city') || firstLine.includes('zip');
  const dataLines = hasHeader ? lines.slice(1) : lines;

  // Try to detect column positions from header
  let addressCol = -1;
  let cityCol = -1;
  let stateCol = -1;
  let zipCol = -1;
  let nameCol = -1;
  let firstNameCol = -1;
  let lastNameCol = -1;

  if (hasHeader) {
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
    headers.forEach((h, i) => {
      // Skip columns that are clearly not address-related
      if (SKIP_HEADERS.some(skip => h.includes(skip))) return;
      if (h.includes('address') || h.includes('street') || h.includes('addr')) addressCol = i;
      else if (h.includes('city') || h.includes('town')) cityCol = i;
      else if (h.includes('state') || h.includes('province')) stateCol = i;
      else if (h.includes('zip') || h.includes('postal') || h.includes('postcode')) zipCol = i;
      else if (h === 'name' || h === 'full name' || h === 'fullname' || h === 'client' || h === 'client name' || h === 'recipient' || h === 'contact') nameCol = i;
      else if (h === 'first' || h === 'first name' || h === 'firstname') firstNameCol = i;
      else if (h === 'last' || h === 'last name' || h === 'lastname') lastNameCol = i;
    });
  }

  // If no address column found in header, try first column
  if (addressCol === -1) addressCol = 0;

  const addresses: AddressData[] = [];
  let skipped = 0;

  for (const line of dataLines) {
    if (!line.trim()) continue;

    // Handle quoted CSV fields
    const cols: string[] = [];
    let current = '';
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        cols.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    cols.push(current.trim());

    const address = cols[addressCol]?.trim();

    // Skip rows without a valid-looking street address
    if (!looksLikeAddress(address)) {
      skipped++;
      continue;
    }

    // Clean city/state/zip — strip any value that looks like email or phone
    const rawCity = cityCol >= 0 ? cols[cityCol]?.trim() : undefined;
    const rawState = stateCol >= 0 ? cols[stateCol]?.trim() : undefined;
    const rawZip = zipCol >= 0 ? cols[zipCol]?.trim() : undefined;

    // Build recipient name from name column or first+last columns
    let recipientName: string | undefined;
    if (nameCol >= 0 && cols[nameCol]?.trim()) {
      recipientName = cols[nameCol].trim();
    } else if (firstNameCol >= 0 || lastNameCol >= 0) {
      const first = firstNameCol >= 0 ? cols[firstNameCol]?.trim() : '';
      const last = lastNameCol >= 0 ? cols[lastNameCol]?.trim() : '';
      const combined = [first, last].filter(Boolean).join(' ');
      if (combined) recipientName = combined;
    }

    addresses.push({
      address,
      city: rawCity && !rawCity.includes('@') ? rawCity : undefined,
      state: rawState && rawState.length <= 3 ? rawState : undefined,
      zipCode: rawZip && /^\d{3,10}(-\d+)?$/.test(rawZip) ? rawZip : undefined,
      recipientName,
    });
  }

  return { addresses, skipped };
}

const AddAddressDialog = ({ open, onOpenChange, onAdd, onAddMultiple }: AddAddressDialogProps) => {
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedAddresses, setParsedAddresses] = useState<AddressData[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setAddress('');
    setCity('');
    setState('');
    setZipCode('');
    setSelectedFile(null);
    setParsedAddresses([]);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = address.trim();
    if (!trimmed) {
      toast.error('Please enter an address');
      return;
    }

    onAdd({
      address: trimmed,
      city: city.trim() || undefined,
      state: state.trim() || undefined,
      zipCode: zipCode.trim() || undefined,
    });
    resetForm();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv') && !file.type.includes('csv')) {
      toast.error('Please upload a CSV file');
      return;
    }
    setSelectedFile(file);
    setParsedAddresses([]);

    // Parse CSV client-side
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text || !text.trim()) {
        toast.error('File appears to be empty');
        return;
      }
      const { addresses, skipped } = parseCSV(text);
      if (addresses.length === 0) {
        toast.error('No valid addresses found. Each row needs a street address with a number (e.g. "123 Main St").');
        return;
      }
      setParsedAddresses(addresses);
      const skippedMsg = skipped > 0 ? ` (${skipped} rows without valid address skipped)` : '';
      if (addresses.length > 50) {
        const batches = Math.ceil(addresses.length / 50);
        toast.success(`Found ${addresses.length} addresses — will auto-split into ${batches} sessions${skippedMsg}`);
      } else {
        toast.success(`Found ${addresses.length} addresses${skippedMsg}`);
      }
    };
    reader.onerror = () => {
      toast.error('Failed to read file');
    };
    reader.readAsText(file);
  };

  const handleAddAll = () => {
    if (parsedAddresses.length === 0) return;

    if (onAddMultiple) {
      onAddMultiple(parsedAddresses);
    } else {
      parsedAddresses.forEach(a => onAdd(a));
    }
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetForm();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Add Address</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="manual" className="mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual" className="gap-1">
              <MapPin className="w-3 h-3" />
              Manual
            </TabsTrigger>
            <TabsTrigger value="csv" className="gap-1">
              <FileText className="w-3 h-3" />
              CSV Upload
            </TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="mt-4">
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pop-address">Street Address *</Label>
                <Input
                  id="pop-address"
                  placeholder="123 Main Street"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="pop-city">City</Label>
                  <Input
                    id="pop-city"
                    placeholder="City"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pop-state">State</Label>
                  <Input
                    id="pop-state"
                    placeholder="NM"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    maxLength={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pop-zip">ZIP</Label>
                  <Input
                    id="pop-zip"
                    placeholder="87101"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full">
                Add Address
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="csv" className="mt-4 space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />

            {!selectedFile ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              >
                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="font-medium">Click to upload CSV</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Columns: name, address, city, state, zip
                </p>
              </div>
            ) : (
              <div className="border-2 border-primary/30 rounded-lg p-4 text-center relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-7 w-7"
                  onClick={() => {
                    setSelectedFile(null);
                    setParsedAddresses([]);
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
                <FileText className="w-6 h-6 mx-auto mb-1 text-primary" />
                <p className="font-medium text-sm truncate px-6">{selectedFile.name}</p>
              </div>
            )}

            {parsedAddresses.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-medium text-center">
                  {parsedAddresses.length} addresses found
                  {parsedAddresses.length > 50 && (
                    <span className="block text-xs text-muted-foreground mt-0.5">
                      Will auto-split into {Math.ceil(parsedAddresses.length / 50)} sessions (50 per session)
                    </span>
                  )}
                </p>
                <div className="max-h-48 overflow-y-auto space-y-1.5">
                  {parsedAddresses.map((addr, idx) => (
                    <div key={idx} className="p-2 bg-muted/50 rounded-md text-sm">
                      {addr.recipientName && (
                        <p className="text-xs font-semibold text-primary">{addr.recipientName}</p>
                      )}
                      <p className="font-medium">{addr.address}</p>
                      {(addr.city || addr.state || addr.zipCode) && (
                        <p className="text-xs text-muted-foreground">
                          {[addr.city, addr.state, addr.zipCode].filter(Boolean).join(', ')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
                <Button onClick={handleAddAll} className="w-full">
                  {parsedAddresses.length > 50
                    ? `Add All ${parsedAddresses.length} Addresses (${Math.ceil(parsedAddresses.length / 50)} sessions)`
                    : `Add All ${parsedAddresses.length} Addresses`
                  }
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AddAddressDialog;
