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
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Link2, Loader2, Upload, FileText, X, Database, Search } from 'lucide-react';

interface PropertyData {
  address: string;
  city?: string;
  state?: string;
  zipCode?: string;
  price?: number;
  photoUrl?: string;
  beds?: number;
  baths?: number;
  sqft?: number;
  description?: string;
  summary?: string;
  yearBuilt?: number;
  lotSize?: string;
  propertyType?: string;
  hoaFee?: number;
  garage?: string;
  heating?: string;
  cooling?: string;
  features?: string[];
}

interface AddPropertyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (data: PropertyData) => void;
  onAddMultiple?: (data: PropertyData[]) => void;
}

const AddPropertyDialog = ({ open, onOpenChange, onAdd, onAddMultiple }: AddPropertyDialogProps) => {
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [price, setPrice] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [beds, setBeds] = useState('');
  const [baths, setBaths] = useState('');
  const [sqft, setSqft] = useState('');
  const [description, setDescription] = useState('');
  const [summary, setSummary] = useState('');
  
  // Extra scraped fields
  const [yearBuilt, setYearBuilt] = useState<number | undefined>();
  const [lotSize, setLotSize] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [hoaFee, setHoaFee] = useState<number | undefined>();
  const [garage, setGarage] = useState('');
  const [heating, setHeating] = useState('');
  const [cooling, setCooling] = useState('');
  const [features, setFeatures] = useState<string[]>([]);

  const [listingUrl, setListingUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [parsedProperties, setParsedProperties] = useState<PropertyData[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // MLS import state
  const [mlsNumber, setMlsNumber] = useState('');
  const [mlsSearchAddress, setMlsSearchAddress] = useState('');
  const [isSearchingMls, setIsSearchingMls] = useState(false);
  const [mlsResults, setMlsResults] = useState<PropertyData[]>([]);

  // Check if URL is from a blocklisted site
  const isBlocklistedUrl = (url: string): { blocked: boolean; site?: string } => {
    const lowercaseUrl = url.toLowerCase();
    if (lowercaseUrl.includes('redfin.com')) {
      return { blocked: true, site: 'Redfin' };
    }
    if (lowercaseUrl.includes('zillow.com')) {
      return { blocked: true, site: 'Zillow' };
    }
    return { blocked: false };
  };

  const handleImportFromUrl = async () => {
    if (!listingUrl.trim()) {
      toast.error('Please enter a listing URL');
      return;
    }

    // Check for blocklisted sites before making API call
    const blockCheck = isBlocklistedUrl(listingUrl);
    if (blockCheck.blocked) {
      toast.error(
        `${blockCheck.site} listings cannot be imported automatically due to their terms of service. Please use Zillow or Realtor.com URLs instead, or enter the property details manually.`,
        { duration: 6000 }
      );
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
        // Check if the error is about blocklisting
        if (data.error?.includes('blocklisted')) {
          throw new Error('This website cannot be scraped. Please use Zillow or Realtor.com URLs instead.');
        }
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
      if (property.description) setDescription(property.description);
      if (property.summary) setSummary(property.summary);
      
      // Extra scraped fields
      if (property.yearBuilt) setYearBuilt(property.yearBuilt);
      if (property.lotSize) setLotSize(property.lotSize);
      if (property.propertyType) setPropertyType(property.propertyType);
      if (property.hoaFee) setHoaFee(property.hoaFee);
      if (property.garage) setGarage(property.garage);
      if (property.heating) setHeating(property.heating);
      if (property.cooling) setCooling(property.cooling);
      if (property.features) setFeatures(property.features);
      
      toast.success('Listing data imported! Review and submit.');
    } catch (error: any) {
      console.error('Import error:', error);
      toast.error(error.message || 'Failed to import listing data');
    } finally {
      setIsImporting(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ['application/pdf', 'text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
      if (!validTypes.includes(file.type) && !file.name.endsWith('.csv')) {
        toast.error('Please upload a PDF, CSV, or Excel file');
        return;
      }
      setSelectedFile(file);
      setParsedProperties([]);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Please sign in to upload files');
      }

      // Upload file to storage
      const filePath = `${user.id}/${Date.now()}-${selectedFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from('mls-uploads')
        .upload(filePath, selectedFile);

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      // Determine file type
      let fileType = 'pdf';
      if (selectedFile.type.includes('csv') || selectedFile.name.endsWith('.csv')) {
        fileType = 'csv';
      } else if (selectedFile.type.includes('excel') || selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls')) {
        fileType = 'excel';
      }

      // Parse the file
      const { data, error } = await supabase.functions.invoke('parse-mls-file', {
        body: { filePath, fileType },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to parse file');
      }

      const properties = data.data as PropertyData[];
      
      if (properties.length === 0) {
        toast.error('No properties found in the file');
        return;
      }

      if (properties.length === 1) {
        // Single property - fill the form
        const prop = properties[0];
        if (prop.address) setAddress(prop.address);
        if (prop.city) setCity(prop.city);
        if (prop.state) setState(prop.state);
        if (prop.zipCode) setZipCode(prop.zipCode);
        if (prop.price) setPrice(prop.price.toString());
        if (prop.beds) setBeds(prop.beds.toString());
        if (prop.baths) setBaths(prop.baths.toString());
        if (prop.sqft) setSqft(prop.sqft.toString());
        toast.success('Property data extracted! Review and submit.');
      } else {
        // Multiple properties - show list
        setParsedProperties(properties);
        toast.success(`Found ${properties.length} properties!`);
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to process file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddAllProperties = () => {
    if (onAddMultiple && parsedProperties.length > 0) {
      onAddMultiple(parsedProperties);
      resetForm();
      onOpenChange(false);
    }
  };

  const handleMlsSearch = async (searchType: 'mls' | 'address') => {
    const searchValue = searchType === 'mls' ? mlsNumber.trim() : mlsSearchAddress.trim();
    if (!searchValue) {
      toast.error(`Please enter ${searchType === 'mls' ? 'an MLS number' : 'an address'}`);
      return;
    }

    setIsSearchingMls(true);
    setMlsResults([]);

    try {
      const { data, error } = await supabase.functions.invoke('spark-import', {
        body: {
          action: 'search',
          ...(searchType === 'mls' ? { mlsNumber: searchValue } : { address: searchValue }),
        },
      });

      if (error) throw new Error(error.message);
      if (!data.success) throw new Error(data.error || 'MLS search failed');

      const listings = data.data || [];
      if (listings.length === 0) {
        toast.info('No listings found');
        return;
      }

      // Map Spark data to our PropertyData format
      const mapped: PropertyData[] = listings.map((l: any) => ({
        address: l.address,
        city: l.city,
        state: l.state,
        zipCode: l.zipCode,
        price: l.price,
        photoUrl: l.photoUrl,
        beds: l.beds,
        baths: l.baths,
        sqft: l.sqft,
        description: l.description,
        summary: l.summary,
        yearBuilt: l.yearBuilt,
        lotSize: l.lotSize,
        propertyType: l.propertyType,
        hoaFee: l.hoaFee,
        garage: l.garage,
        heating: l.heating,
        cooling: l.cooling,
        features: l.features,
      }));

      if (mapped.length === 1) {
        // Single result - auto-fill form
        const prop = mapped[0];
        if (prop.address) setAddress(prop.address);
        if (prop.city) setCity(prop.city);
        if (prop.state) setState(prop.state);
        if (prop.zipCode) setZipCode(prop.zipCode);
        if (prop.price) setPrice(prop.price.toString());
        if (prop.photoUrl) setPhotoUrl(prop.photoUrl);
        if (prop.beds) setBeds(prop.beds.toString());
        if (prop.baths) setBaths(prop.baths.toString());
        if (prop.sqft) setSqft(prop.sqft.toString());
        if (prop.description) setDescription(prop.description);
        if (prop.summary) setSummary(prop.summary);
        if (prop.yearBuilt) setYearBuilt(prop.yearBuilt);
        if (prop.lotSize) setLotSize(prop.lotSize);
        if (prop.propertyType) setPropertyType(prop.propertyType);
        if (prop.hoaFee) setHoaFee(prop.hoaFee);
        if (prop.garage) setGarage(prop.garage);
        if (prop.heating) setHeating(prop.heating);
        if (prop.cooling) setCooling(prop.cooling);
        if (prop.features) setFeatures(prop.features);
        toast.success('Listing imported! Review and submit.');
      } else {
        setMlsResults(mapped);
        toast.success(`Found ${mapped.length} listings`);
      }
    } catch (err: any) {
      console.error('MLS search error:', err);
      toast.error(err.message || 'Failed to search MLS');
    } finally {
      setIsSearchingMls(false);
    }
  };

  const handleSelectMlsResult = (prop: PropertyData) => {
    if (prop.address) setAddress(prop.address);
    if (prop.city) setCity(prop.city);
    if (prop.state) setState(prop.state);
    if (prop.zipCode) setZipCode(prop.zipCode);
    if (prop.price) setPrice(prop.price.toString());
    if (prop.photoUrl) setPhotoUrl(prop.photoUrl);
    if (prop.beds) setBeds(prop.beds.toString());
    if (prop.baths) setBaths(prop.baths.toString());
    if (prop.sqft) setSqft(prop.sqft.toString());
    if (prop.description) setDescription(prop.description);
    if (prop.summary) setSummary(prop.summary);
    if (prop.yearBuilt) setYearBuilt(prop.yearBuilt);
    if (prop.lotSize) setLotSize(prop.lotSize);
    if (prop.propertyType) setPropertyType(prop.propertyType);
    if (prop.hoaFee) setHoaFee(prop.hoaFee);
    if (prop.garage) setGarage(prop.garage);
    if (prop.heating) setHeating(prop.heating);
    if (prop.cooling) setCooling(prop.cooling);
    if (prop.features) setFeatures(prop.features);
    setMlsResults([]);
    toast.success('Listing selected! Review and submit.');
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
        description: description.trim() || undefined,
        summary: summary.trim() || undefined,
        yearBuilt: yearBuilt,
        lotSize: lotSize.trim() || undefined,
        propertyType: propertyType.trim() || undefined,
        hoaFee: hoaFee,
        garage: garage.trim() || undefined,
        heating: heating.trim() || undefined,
        cooling: cooling.trim() || undefined,
        features: features.length > 0 ? features : undefined,
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
    setDescription('');
    setSummary('');
    setYearBuilt(undefined);
    setLotSize('');
    setPropertyType('');
    setHoaFee(undefined);
    setGarage('');
    setHeating('');
    setCooling('');
    setFeatures([]);
    setListingUrl('');
    setSelectedFile(null);
    setParsedProperties([]);
    setMlsNumber('');
    setMlsSearchAddress('');
    setMlsResults([]);
  };
  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetForm();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            Add Property
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="manual" className="mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="manual">Manual</TabsTrigger>
            <TabsTrigger value="url">URL</TabsTrigger>
            <TabsTrigger value="file">File</TabsTrigger>
            <TabsTrigger value="mls" className="gap-1">
              <Database className="w-3 h-3" />
              MLS
            </TabsTrigger>
          </TabsList>
          <TabsContent value="url" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="listingUrl">Listing URL</Label>
              <div className="flex gap-2">
                <Input
                  id="listingUrl"
                  placeholder="https://realtor.com/..."
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
                Paste a Realtor.com listing URL. Redfin and Zillow are not supported.
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

          <TabsContent value="file" className="space-y-4 mt-4">
            <div className="space-y-3">
              <Label>Upload MLS File</Label>
              
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.csv,.xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              {!selectedFile ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                >
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="font-medium">Click to upload</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PDF, CSV, or Excel files
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <FileText className="w-8 h-8 text-primary" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSelectedFile(null);
                      setParsedProperties([]);
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {selectedFile && parsedProperties.length === 0 && (
                <Button
                  type="button"
                  onClick={handleFileUpload}
                  disabled={isUploading}
                  className="w-full gap-2"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Extract Properties
                    </>
                  )}
                </Button>
              )}

              {parsedProperties.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm font-medium">
                    Found {parsedProperties.length} properties:
                  </p>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {parsedProperties.map((prop, idx) => (
                      <div key={idx} className="p-2 bg-muted/50 rounded text-sm">
                        <p className="font-medium">{prop.address}</p>
                        {prop.city && prop.state && (
                          <p className="text-muted-foreground text-xs">
                            {prop.city}, {prop.state}
                          </p>
                        )}
                        {prop.price && (
                          <p className="text-accent text-xs">
                            ${prop.price.toLocaleString()}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                  <Button
                    type="button"
                    onClick={handleAddAllProperties}
                    className="w-full"
                  >
                    Add All {parsedProperties.length} Properties
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="manual" className="mt-4">
            {/* Form is shared between tabs */}
          </TabsContent>

          <TabsContent value="mls" className="space-y-4 mt-4">
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="mlsNumber">Search by MLS #</Label>
                <div className="flex gap-2">
                  <Input
                    id="mlsNumber"
                    placeholder="Enter MLS number"
                    value={mlsNumber}
                    onChange={(e) => setMlsNumber(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    onClick={() => handleMlsSearch('mls')}
                    disabled={isSearchingMls}
                    size="sm"
                  >
                    {isSearchingMls ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">or</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mlsSearchAddress">Search by Address</Label>
                <div className="flex gap-2">
                  <Input
                    id="mlsSearchAddress"
                    placeholder="123 Main St, City, State"
                    value={mlsSearchAddress}
                    onChange={(e) => setMlsSearchAddress(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    onClick={() => handleMlsSearch('address')}
                    disabled={isSearchingMls}
                    size="sm"
                  >
                    {isSearchingMls ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Configure your Spark API credentials in Profile settings to enable MLS import.
              </p>

              {mlsResults.length > 0 && (
                <div className="space-y-3 pt-2">
                  <p className="text-sm font-medium">
                    Found {mlsResults.length} listings:
                  </p>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {mlsResults.map((prop, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted transition-colors"
                        onClick={() => handleSelectMlsResult(prop)}
                      >
                        <p className="font-medium">{prop.address}</p>
                        {prop.city && prop.state && (
                          <p className="text-muted-foreground text-xs">
                            {prop.city}, {prop.state} {prop.zipCode}
                          </p>
                        )}
                        <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                          {prop.beds && <span>{prop.beds} bed</span>}
                          {prop.baths && <span>{prop.baths} bath</span>}
                          {prop.sqft && <span>{prop.sqft.toLocaleString()} sqft</span>}
                        </div>
                        {prop.price && (
                          <p className="text-accent font-medium text-sm mt-1">
                            ${prop.price.toLocaleString()}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {address && mlsResults.length === 0 && (
                <div className="p-3 bg-muted rounded-lg text-sm">
                  <p className="font-medium">Imported: {address}</p>
                  {city && state && <p className="text-muted-foreground">{city}, {state} {zipCode}</p>}
                  {price && <p className="text-accent font-medium">${Number(price).toLocaleString()}</p>}
                </div>
              )}
            </div>
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
