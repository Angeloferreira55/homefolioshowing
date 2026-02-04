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
import { Link2, Loader2, Upload, FileText, X, ImagePlus } from 'lucide-react';

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
  // Extended MLS fields
  mlsNumber?: string;
  daysOnMarket?: number;
  pricePerSqft?: number;
  lotSizeAcres?: number;
  garageSpaces?: number;
  roof?: string;
  taxAnnualAmount?: number;
  hasHoa?: boolean;
  hoaFeeFrequency?: string;
  hasPid?: boolean;
  publicRemarks?: string;
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
  
  // Extended MLS fields
  const [mlsNumber, setMlsNumber] = useState('');
  const [daysOnMarket, setDaysOnMarket] = useState<number | undefined>();
  const [pricePerSqft, setPricePerSqft] = useState<number | undefined>();
  const [lotSizeAcres, setLotSizeAcres] = useState<number | undefined>();
  const [garageSpaces, setGarageSpaces] = useState<number | undefined>();
  const [roof, setRoof] = useState('');
  const [taxAnnualAmount, setTaxAnnualAmount] = useState<number | undefined>();
  const [hasHoa, setHasHoa] = useState<boolean | undefined>();
  const [hoaFeeFrequency, setHoaFeeFrequency] = useState('');
  const [hasPid, setHasPid] = useState<boolean | undefined>();

  const [listingUrl, setListingUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [parsedProperties, setParsedProperties] = useState<PropertyData[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Photo upload state
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Helper to populate form from extracted property data
  const populateFormFromProperty = (prop: PropertyData) => {
    if (prop.address) setAddress(prop.address);
    if (prop.city) setCity(prop.city);
    if (prop.state) setState(prop.state);
    if (prop.zipCode) setZipCode(prop.zipCode);
    if (prop.price) setPrice(prop.price.toString());
    if (prop.beds) setBeds(prop.beds.toString());
    if (prop.baths) setBaths(prop.baths.toString());
    if (prop.sqft) setSqft(prop.sqft.toString());
    if (prop.description) setDescription(prop.description);
    if (prop.summary) setSummary(prop.summary);
    if (prop.yearBuilt) setYearBuilt(prop.yearBuilt);
    if (prop.propertyType) setPropertyType(prop.propertyType);
    if (prop.heating) setHeating(prop.heating);
    if (prop.cooling) setCooling(prop.cooling);
    if (prop.features) setFeatures(prop.features);
    
    // Extended MLS fields
    if (prop.mlsNumber) setMlsNumber(prop.mlsNumber);
    if (prop.daysOnMarket !== undefined) setDaysOnMarket(prop.daysOnMarket);
    if (prop.pricePerSqft !== undefined) setPricePerSqft(prop.pricePerSqft);
    if (prop.garageSpaces !== undefined) {
      setGarageSpaces(prop.garageSpaces);
      setGarage(prop.garageSpaces.toString());
    } else if (prop.garage) {
      setGarage(prop.garage);
    }
    if (prop.lotSizeAcres !== undefined) {
      setLotSizeAcres(prop.lotSizeAcres);
      setLotSize(`${prop.lotSizeAcres} acres`);
    } else if (prop.lotSize) {
      setLotSize(prop.lotSize);
    }
    if (prop.roof) setRoof(prop.roof);
    if (prop.taxAnnualAmount !== undefined) setTaxAnnualAmount(prop.taxAnnualAmount);
    if (prop.hasHoa !== undefined) setHasHoa(prop.hasHoa);
    if (prop.hoaFee !== undefined) setHoaFee(prop.hoaFee);
    if (prop.hoaFeeFrequency) setHoaFeeFrequency(prop.hoaFeeFrequency);
    if (prop.hasPid !== undefined) setHasPid(prop.hasPid);
    if (prop.publicRemarks) setDescription(prop.publicRemarks);
  };

  // Handle photo upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setIsUploadingPhoto(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Please sign in to upload photos');
      }

      // Upload to client-photos bucket
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('client-photos')
        .upload(fileName, file);

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('client-photos')
        .getPublicUrl(fileName);

      setPhotoUrl(publicUrl);
      toast.success('Photo uploaded successfully!');
    } catch (error: any) {
      console.error('Photo upload error:', error);
      toast.error(error.message || 'Failed to upload photo');
    } finally {
      setIsUploadingPhoto(false);
      // Reset the input
      if (photoInputRef.current) {
        photoInputRef.current.value = '';
      }
    }
  };


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
        // Single property - fill the form with all extracted fields
        const prop = properties[0];
        populateFormFromProperty(prop);
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
    // Reset extended MLS fields
    setMlsNumber('');
    setDaysOnMarket(undefined);
    setPricePerSqft(undefined);
    setLotSizeAcres(undefined);
    setGarageSpaces(undefined);
    setRoof('');
    setTaxAnnualAmount(undefined);
    setHasHoa(undefined);
    setHoaFeeFrequency('');
    setHasPid(undefined);
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

        <Tabs defaultValue="file" className="mt-4 w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="file" className="gap-1">
              <FileText className="w-3 h-3" />
              MLS Sheet
            </TabsTrigger>
            <TabsTrigger value="url">URL</TabsTrigger>
            <TabsTrigger value="manual">Manual</TabsTrigger>
          </TabsList>

          <TabsContent value="file" className="space-y-4 mt-4 w-full">
            <div className="space-y-3 w-full">
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
                  className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors w-full"
                >
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="font-medium">Click to upload</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PDF, CSV, or Excel files
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg w-full">
                  <FileText className="w-8 h-8 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="flex-shrink-0"
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
                <div className="space-y-3 w-full">
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

            {/* Show form fields after extraction */}
            {address && (
              <form onSubmit={handleSubmit} className="space-y-5 pt-4 border-t border-border w-full">
                <div className="p-3 bg-muted rounded-lg text-sm">
                  <p className="font-medium text-primary">✓ Property data extracted</p>
                  <p className="text-muted-foreground mt-1">Review details below and click Add Property when ready.</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="address-file">Street Address *</Label>
                  <Input
                    id="address-file"
                    placeholder="123 Main Street"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city-file">City</Label>
                    <Input
                      id="city-file"
                      placeholder="Albuquerque"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state-file">State</Label>
                    <Input
                      id="state-file"
                      placeholder="NM"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      maxLength={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zipCode-file">ZIP Code</Label>
                    <Input
                      id="zipCode-file"
                      placeholder="87101"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price-file">Price</Label>
                    <Input
                      id="price-file"
                      placeholder="$500,000"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="beds-file">Beds</Label>
                    <Input
                      id="beds-file"
                      placeholder="3"
                      value={beds}
                      onChange={(e) => setBeds(e.target.value)}
                      type="number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="baths-file">Baths</Label>
                    <Input
                      id="baths-file"
                      placeholder="2"
                      value={baths}
                      onChange={(e) => setBaths(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sqft-file">Sqft</Label>
                    <Input
                      id="sqft-file"
                      placeholder="1,800"
                      value={sqft}
                      onChange={(e) => setSqft(e.target.value)}
                      type="number"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Property Photo</Label>
                  
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  
                  {photoUrl ? (
                    <div className="relative w-full">
                      <img 
                        src={photoUrl} 
                        alt="Property preview" 
                        className="w-full h-40 object-cover rounded-lg border"
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="absolute top-2 right-2 gap-1"
                        onClick={() => photoInputRef.current?.click()}
                        disabled={isUploadingPhoto}
                      >
                        {isUploadingPhoto ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <ImagePlus className="w-3 h-3" />
                        )}
                        Change
                      </Button>
                    </div>
                  ) : (
                    <div
                      onClick={() => !isUploadingPhoto && photoInputRef.current?.click()}
                      className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors w-full"
                    >
                      {isUploadingPhoto ? (
                        <>
                          <Loader2 className="w-8 h-8 mx-auto mb-2 text-primary animate-spin" />
                          <p className="text-sm text-muted-foreground">Uploading...</p>
                        </>
                      ) : (
                        <>
                          <ImagePlus className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="font-medium text-sm">Click to upload photo</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            JPG, PNG up to 5MB
                          </p>
                        </>
                      )}
                    </div>
                  )}
                  
                  <div className="flex gap-2 items-center">
                    <span className="text-xs text-muted-foreground">or paste URL:</span>
                    <Input
                      placeholder="https://..."
                      value={photoUrl}
                      onChange={(e) => setPhotoUrl(e.target.value)}
                      className="flex-1 h-8 text-sm"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-primary text-primary-foreground font-semibold uppercase tracking-wide"
                >
                  Add Property
                </Button>
              </form>
            )}
          </TabsContent>

          <TabsContent value="url" className="space-y-4 mt-4 w-full">
            <div className="space-y-2 w-full">
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
              <div className="p-3 bg-muted rounded-lg text-sm w-full">
                <p className="font-medium">Imported: {address}</p>
                {city && state && <p className="text-muted-foreground">{city}, {state} {zipCode}</p>}
                {price && <p className="text-accent font-medium">${Number(price).toLocaleString()}</p>}
              </div>
            )}

            {/* URL tab form */}
            <form onSubmit={handleSubmit} className="space-y-5 w-full">
              <div className="space-y-2">
                <Label htmlFor="address-url">Street Address *</Label>
                <Input
                  id="address-url"
                  placeholder="123 Main Street"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city-url">City</Label>
                  <Input
                    id="city-url"
                    placeholder="Albuquerque"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state-url">State</Label>
                  <Input
                    id="state-url"
                    placeholder="NM"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    maxLength={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zipCode-url">ZIP Code</Label>
                  <Input
                    id="zipCode-url"
                    placeholder="87101"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price-url">Price</Label>
                  <Input
                    id="price-url"
                    placeholder="$500,000"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="beds-url">Beds</Label>
                  <Input
                    id="beds-url"
                    placeholder="3"
                    value={beds}
                    onChange={(e) => setBeds(e.target.value)}
                    type="number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="baths-url">Baths</Label>
                  <Input
                    id="baths-url"
                    placeholder="2"
                    value={baths}
                    onChange={(e) => setBaths(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sqft-url">Sqft</Label>
                  <Input
                    id="sqft-url"
                    placeholder="1,800"
                    value={sqft}
                    onChange={(e) => setSqft(e.target.value)}
                    type="number"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Property Photo</Label>
                
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  id="photo-input-url"
                />
                
                {photoUrl ? (
                  <div className="relative w-full">
                    <img 
                      src={photoUrl} 
                      alt="Property preview" 
                      className="w-full h-40 object-cover rounded-lg border"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="absolute top-2 right-2 gap-1"
                      onClick={() => document.getElementById('photo-input-url')?.click()}
                      disabled={isUploadingPhoto}
                    >
                      {isUploadingPhoto ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <ImagePlus className="w-3 h-3" />
                      )}
                      Change
                    </Button>
                  </div>
                ) : (
                  <div
                    onClick={() => !isUploadingPhoto && document.getElementById('photo-input-url')?.click()}
                    className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors w-full"
                  >
                    {isUploadingPhoto ? (
                      <>
                        <Loader2 className="w-8 h-8 mx-auto mb-2 text-primary animate-spin" />
                        <p className="text-sm text-muted-foreground">Uploading...</p>
                      </>
                    ) : (
                      <>
                        <ImagePlus className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="font-medium text-sm">Click to upload photo</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          JPG, PNG up to 5MB
                        </p>
                      </>
                    )}
                  </div>
                )}
                
                <div className="flex gap-2 items-center">
                  <span className="text-xs text-muted-foreground">or paste URL:</span>
                  <Input
                    placeholder="https://..."
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    className="flex-1 h-8 text-sm"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-primary text-primary-foreground font-semibold uppercase tracking-wide"
              >
                Add Property
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="manual" className="mt-4 w-full">
            <form onSubmit={handleSubmit} className="space-y-5 w-full">
              <div className="space-y-2">
                <Label htmlFor="address-manual">Street Address *</Label>
                <Input
                  id="address-manual"
                  placeholder="123 Main Street"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city-manual">City</Label>
                  <Input
                    id="city-manual"
                    placeholder="Albuquerque"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state-manual">State</Label>
                  <Input
                    id="state-manual"
                    placeholder="NM"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    maxLength={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zipCode-manual">ZIP Code</Label>
                  <Input
                    id="zipCode-manual"
                    placeholder="87101"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price-manual">Price</Label>
                  <Input
                    id="price-manual"
                    placeholder="$500,000"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="beds-manual">Beds</Label>
                  <Input
                    id="beds-manual"
                    placeholder="3"
                    value={beds}
                    onChange={(e) => setBeds(e.target.value)}
                    type="number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="baths-manual">Baths</Label>
                  <Input
                    id="baths-manual"
                    placeholder="2"
                    value={baths}
                    onChange={(e) => setBaths(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sqft-manual">Sqft</Label>
                  <Input
                    id="sqft-manual"
                    placeholder="1,800"
                    value={sqft}
                    onChange={(e) => setSqft(e.target.value)}
                    type="number"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Property Photo</Label>
                
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  id="photo-input-manual"
                />
                
                {photoUrl ? (
                  <div className="relative w-full">
                    <img 
                      src={photoUrl} 
                      alt="Property preview" 
                      className="w-full h-40 object-cover rounded-lg border"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="absolute top-2 right-2 gap-1"
                      onClick={() => document.getElementById('photo-input-manual')?.click()}
                      disabled={isUploadingPhoto}
                    >
                      {isUploadingPhoto ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <ImagePlus className="w-3 h-3" />
                      )}
                      Change
                    </Button>
                  </div>
                ) : (
                  <div
                    onClick={() => !isUploadingPhoto && document.getElementById('photo-input-manual')?.click()}
                    className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors w-full"
                  >
                    {isUploadingPhoto ? (
                      <>
                        <Loader2 className="w-8 h-8 mx-auto mb-2 text-primary animate-spin" />
                        <p className="text-sm text-muted-foreground">Uploading...</p>
                      </>
                    ) : (
                      <>
                        <ImagePlus className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="font-medium text-sm">Click to upload photo</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          JPG, PNG up to 5MB
                        </p>
                      </>
                    )}
                  </div>
                )}
                
                <div className="flex gap-2 items-center">
                  <span className="text-xs text-muted-foreground">or paste URL:</span>
                  <Input
                    placeholder="https://..."
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    className="flex-1 h-8 text-sm"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-primary text-primary-foreground font-semibold uppercase tracking-wide"
              >
                Add Property
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AddPropertyDialog;
