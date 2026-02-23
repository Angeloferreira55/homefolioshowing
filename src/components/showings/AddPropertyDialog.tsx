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
import { Loader2, Upload, FileText, X, ImagePlus, AlertCircle, Search } from 'lucide-react';
import { validateProperty, ERROR_MESSAGES } from '@/lib/errorHandling';

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
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
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

  // MLS search state
  const [mlsSearchQuery, setMlsSearchQuery] = useState('');
  const [isSearchingMls, setIsSearchingMls] = useState(false);

  // Bulk MLS import state
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkMlsNumbers, setBulkMlsNumbers] = useState('');
  const [isBulkSearching, setIsBulkSearching] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });
  const [bulkResults, setBulkResults] = useState<{ number: string; property?: PropertyData; error?: string }[]>([]);
  
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


  const handleMlsSearch = async () => {
    const query = mlsSearchQuery.trim();
    if (!query) {
      toast.error('Please enter an MLS number');
      return;
    }

    setIsSearchingMls(true);
    try {
      const { data, error } = await supabase.functions.invoke('spark-import', {
        body: { action: 'search_mls', mls_number: query },
      });

      if (error) throw new Error(error.message);

      if (!data?.success) {
        const msg = data?.error || 'Failed to find listing';
        if (msg.includes('credentials not configured')) {
          toast.error('MLS credentials not configured. Please add your Spark API credentials in Profile settings.', { duration: 5000 });
        } else {
          toast.error(msg);
        }
        return;
      }

      const listing = data.data;
      populateFormFromProperty({
        mlsNumber: listing.mls_number,
        address: listing.address,
        city: listing.city,
        state: listing.state,
        zipCode: listing.zip_code,
        price: listing.price,
        beds: listing.beds,
        baths: listing.baths,
        sqft: listing.sqft,
        lotSize: listing.lot_size,
        yearBuilt: listing.year_built,
        propertyType: listing.property_type,
        description: listing.description,
        heating: listing.heating,
        cooling: listing.cooling,
        garage: listing.garage,
        hoaFee: listing.hoa_fee,
        photoUrl: listing.photo_url,
        features: listing.features,
      });

      toast.success('Listing data imported! Review and submit.');
    } catch (err: any) {
      console.error('MLS search error:', err);
      toast.error(err.message || 'Failed to search MLS');
    } finally {
      setIsSearchingMls(false);
    }
  };

  const handleBulkMlsSearch = async () => {
    const raw = bulkMlsNumbers.trim();
    if (!raw) {
      toast.error('Please enter MLS numbers');
      return;
    }

    // Parse MLS numbers: split by comma, newline, or space
    const numbers = raw
      .split(/[\n,\s]+/)
      .map(n => n.trim())
      .filter(n => n.length > 0);

    if (numbers.length === 0) {
      toast.error('No valid MLS numbers found');
      return;
    }

    if (numbers.length > 25) {
      toast.error('Maximum 25 MLS numbers at a time');
      return;
    }

    setIsBulkSearching(true);
    setBulkProgress({ current: 0, total: numbers.length });
    setBulkResults([]);

    const results: { number: string; property?: PropertyData; error?: string }[] = [];

    for (let i = 0; i < numbers.length; i++) {
      const mlsNum = numbers[i];
      setBulkProgress({ current: i + 1, total: numbers.length });

      try {
        const { data, error } = await supabase.functions.invoke('spark-import', {
          body: { action: 'search_mls', mls_number: mlsNum },
        });

        if (error) throw new Error(error.message);

        if (!data?.success) {
          results.push({ number: mlsNum, error: data?.error || 'Not found' });
          continue;
        }

        const listing = data.data;
        const property: PropertyData = {
          mlsNumber: listing.mls_number,
          address: listing.address,
          city: listing.city,
          state: listing.state,
          zipCode: listing.zip_code,
          price: listing.price,
          beds: listing.beds,
          baths: listing.baths,
          sqft: listing.sqft,
          lotSize: listing.lot_size,
          yearBuilt: listing.year_built,
          propertyType: listing.property_type,
          description: listing.description,
          heating: listing.heating,
          cooling: listing.cooling,
          garage: listing.garage,
          hoaFee: listing.hoa_fee,
          photoUrl: listing.photo_url,
          features: listing.features,
        };

        results.push({ number: mlsNum, property });
      } catch (err: any) {
        results.push({ number: mlsNum, error: err.message || 'Failed to search' });
      }
    }

    setBulkResults(results);
    setIsBulkSearching(false);

    const successCount = results.filter(r => r.property).length;
    const failCount = results.filter(r => r.error).length;

    if (successCount > 0) {
      toast.success(`Found ${successCount} of ${numbers.length} listings${failCount > 0 ? ` (${failCount} failed)` : ''}`);
    } else {
      toast.error('No listings found for the provided MLS numbers');
    }
  };

  const handleAddAllBulkResults = () => {
    const properties = bulkResults
      .filter(r => r.property)
      .map(r => r.property!);

    if (properties.length === 0) return;

    if (onAddMultiple) {
      onAddMultiple(properties);
    } else {
      // Fallback: add one at a time
      properties.forEach(p => onAdd(p));
    }

    resetForm();
    onOpenChange(false);
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

      // Start the parsing job
      const { data, error } = await supabase.functions.invoke('parse-mls-file', {
        body: { filePath, fileType },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to start parsing');
      }

      const jobId = data.jobId;
      if (!jobId) {
        throw new Error('No job ID returned from parsing service');
      }

      // Poll for job completion
      toast.info('Processing file...');
      const maxAttempts = 60; // 60 seconds max
      let attempts = 0;

      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;

        const { data: job, error: jobError } = await supabase
          .from('mls_parsing_jobs')
          .select('status, progress, result, error')
          .eq('id', jobId)
          .single();

        if (jobError) {
          console.error('Job poll error:', jobError);
          continue;
        }

        if (job.status === 'complete') {
          const properties = (job.result as unknown as PropertyData[]) || [];
          
          if (properties.length === 0) {
            toast.error('No properties found in the file');
            return;
          }

          if (properties.length === 1) {
            const prop = properties[0];
            populateFormFromProperty(prop);
            toast.success('Property data extracted! Review and submit.');
          } else {
            setParsedProperties(properties);
            toast.success(`Found ${properties.length} properties!`);
          }
          return;
        }

        if (job.status === 'error') {
          throw new Error(job.error || 'Failed to parse file');
        }
      }

      throw new Error('Parsing timed out. Please try again.');
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

    // Parse values for validation
    const parsedPrice = price ? parseFloat(price.replace(/[^0-9.]/g, '')) : undefined;
    const parsedBeds = beds ? parseInt(beds) : undefined;
    const parsedBaths = baths ? parseFloat(baths) : undefined;
    const parsedSqft = sqft ? parseInt(sqft) : undefined;

    // Validate the property data
    const validation = validateProperty({
      address: address.trim(),
      price: parsedPrice,
      beds: parsedBeds,
      baths: parsedBaths,
      sqft: parsedSqft,
    });

    if (!validation.valid) {
      setValidationErrors(validation.errors);
      toast.error(ERROR_MESSAGES.VALIDATION_ERROR);
      return;
    }

    // Clear validation errors
    setValidationErrors({});

    onAdd({
      address: address.trim(),
      city: city.trim() || undefined,
      state: state.trim() || undefined,
      zipCode: zipCode.trim() || undefined,
      price: parsedPrice,
      photoUrl: photoUrl.trim() || undefined,
      beds: parsedBeds,
      baths: parsedBaths,
      sqft: parsedSqft,
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
    setMlsSearchQuery('');
    setShowBulkImport(false);
    setBulkMlsNumbers('');
    setBulkResults([]);
    setBulkProgress({ current: 0, total: 0 });
    setSelectedFile(null);
    setParsedProperties([]);
    setValidationErrors({});
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
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            Add Property
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="mls" className="mt-4 w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="mls" className="gap-1">
              <Search className="w-3 h-3" />
              MLS #
            </TabsTrigger>
            <TabsTrigger value="file" className="gap-1">
              <FileText className="w-3 h-3" />
              MLS Sheet
            </TabsTrigger>
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

          <TabsContent value="mls" className="space-y-4 mt-4 w-full">
            {!showBulkImport ? (
              <>
                <div className="space-y-2 w-full">
                  <Label htmlFor="mlsSearch">MLS Number</Label>
                  <div className="flex gap-2">
                    <Input
                      id="mlsSearch"
                      placeholder="e.g. 1084291"
                      value={mlsSearchQuery}
                      onChange={(e) => setMlsSearchQuery(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleMlsSearch(); } }}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      onClick={handleMlsSearch}
                      disabled={isSearchingMls}
                      className="gap-2"
                    >
                      {isSearchingMls ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Search className="w-4 h-4" />
                      )}
                      {isSearchingMls ? 'Searching...' : 'Search'}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      Enter an MLS listing number to auto-import property details.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowBulkImport(true)}
                      className="text-xs text-accent hover:underline"
                    >
                      Import multiple
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-3 w-full">
                <div className="flex items-center justify-between">
                  <Label>Bulk MLS Import</Label>
                  <button
                    type="button"
                    onClick={() => { setShowBulkImport(false); setBulkResults([]); setBulkMlsNumbers(''); }}
                    className="text-xs text-accent hover:underline"
                  >
                    Single search
                  </button>
                </div>
                <textarea
                  placeholder="Enter MLS numbers separated by spaces, commas, or new lines&#10;&#10;e.g. 1084291 1084292 1084293"
                  value={bulkMlsNumbers}
                  onChange={(e) => setBulkMlsNumbers(e.target.value)}
                  className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                  disabled={isBulkSearching}
                />
                <Button
                  type="button"
                  onClick={handleBulkMlsSearch}
                  disabled={isBulkSearching || !bulkMlsNumbers.trim()}
                  className="w-full gap-2"
                >
                  {isBulkSearching ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Searching {bulkProgress.current} of {bulkProgress.total}...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      Search All
                    </>
                  )}
                </Button>

                {/* Bulk results */}
                {bulkResults.length > 0 && (
                  <div className="space-y-3 w-full">
                    <p className="text-sm font-medium">
                      Results: {bulkResults.filter(r => r.property).length} found, {bulkResults.filter(r => r.error).length} failed
                    </p>
                    <div className="max-h-48 overflow-y-auto space-y-2">
                      {bulkResults.map((result, idx) => (
                        <div
                          key={idx}
                          className={`p-2 rounded text-sm ${result.property ? 'bg-muted/50' : 'bg-destructive/10'}`}
                        >
                          {result.property ? (
                            <>
                              <p className="font-medium">{result.property.address}</p>
                              <div className="flex gap-3 text-xs text-muted-foreground">
                                {result.property.city && result.property.state && (
                                  <span>{result.property.city}, {result.property.state}</span>
                                )}
                                {result.property.price && (
                                  <span className="text-accent">${result.property.price.toLocaleString()}</span>
                                )}
                                {result.property.beds && <span>{result.property.beds}bd</span>}
                                {result.property.baths && <span>{result.property.baths}ba</span>}
                              </div>
                            </>
                          ) : (
                            <p className="text-destructive">
                              MLS# {result.number}: {result.error}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                    {bulkResults.some(r => r.property) && (
                      <Button
                        type="button"
                        onClick={handleAddAllBulkResults}
                        className="w-full"
                      >
                        Add {bulkResults.filter(r => r.property).length} Properties
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Show form fields after single MLS search */}
            {!showBulkImport && address && (
              <form onSubmit={handleSubmit} className="space-y-5 pt-4 border-t border-border w-full">
                <div className="p-3 bg-muted rounded-lg text-sm">
                  <p className="font-medium text-primary">✓ Listing data imported</p>
                  <p className="text-muted-foreground mt-1">Review details below and click Add Property when ready.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address-mls">Street Address *</Label>
                  <Input
                    id="address-mls"
                    placeholder="123 Main Street"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city-mls">City</Label>
                    <Input
                      id="city-mls"
                      placeholder="Albuquerque"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state-mls">State</Label>
                    <Input
                      id="state-mls"
                      placeholder="NM"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      maxLength={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zipCode-mls">ZIP Code</Label>
                    <Input
                      id="zipCode-mls"
                      placeholder="87101"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price-mls">Price</Label>
                    <Input
                      id="price-mls"
                      placeholder="$500,000"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="beds-mls">Beds</Label>
                    <Input
                      id="beds-mls"
                      placeholder="3"
                      value={beds}
                      onChange={(e) => setBeds(e.target.value)}
                      type="number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="baths-mls">Baths</Label>
                    <Input
                      id="baths-mls"
                      placeholder="2"
                      value={baths}
                      onChange={(e) => setBaths(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sqft-mls">Sqft</Label>
                    <Input
                      id="sqft-mls"
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
                    id="photo-input-mls"
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
                        onClick={() => document.getElementById('photo-input-mls')?.click()}
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
                      onClick={() => !isUploadingPhoto && document.getElementById('photo-input-mls')?.click()}
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

          <TabsContent value="manual" className="mt-4 w-full">
            <form onSubmit={handleSubmit} className="space-y-5 w-full">
              <div className="space-y-2">
                <Label htmlFor="address-manual">Street Address *</Label>
                <Input
                  id="address-manual"
                  placeholder="123 Main Street"
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    if (validationErrors.address) {
                      setValidationErrors((prev) => {
                        const newErrors = { ...prev };
                        delete newErrors.address;
                        return newErrors;
                      });
                    }
                  }}
                  required
                  className={validationErrors.address ? 'border-destructive' : ''}
                />
                {validationErrors.address && (
                  <div className="flex items-center gap-1 text-sm text-destructive">
                    <AlertCircle className="w-3 h-3" />
                    <span>{validationErrors.address}</span>
                  </div>
                )}
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
                    onChange={(e) => {
                      setPrice(e.target.value);
                      if (validationErrors.price) {
                        setValidationErrors((prev) => {
                          const newErrors = { ...prev };
                          delete newErrors.price;
                          return newErrors;
                        });
                      }
                    }}
                    className={validationErrors.price ? 'border-destructive' : ''}
                  />
                  {validationErrors.price && (
                    <div className="flex items-center gap-1 text-xs text-destructive">
                      <AlertCircle className="w-3 h-3" />
                      <span>{validationErrors.price}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="beds-manual">Beds</Label>
                  <Input
                    id="beds-manual"
                    placeholder="3"
                    value={beds}
                    onChange={(e) => {
                      setBeds(e.target.value);
                      if (validationErrors.beds) {
                        setValidationErrors((prev) => {
                          const newErrors = { ...prev };
                          delete newErrors.beds;
                          return newErrors;
                        });
                      }
                    }}
                    type="number"
                    className={validationErrors.beds ? 'border-destructive' : ''}
                  />
                  {validationErrors.beds && (
                    <div className="flex items-center gap-1 text-xs text-destructive">
                      <AlertCircle className="w-3 h-3" />
                      <span>{validationErrors.beds}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="baths-manual">Baths</Label>
                  <Input
                    id="baths-manual"
                    placeholder="2"
                    value={baths}
                    onChange={(e) => {
                      setBaths(e.target.value);
                      if (validationErrors.baths) {
                        setValidationErrors((prev) => {
                          const newErrors = { ...prev };
                          delete newErrors.baths;
                          return newErrors;
                        });
                      }
                    }}
                    className={validationErrors.baths ? 'border-destructive' : ''}
                  />
                  {validationErrors.baths && (
                    <div className="flex items-center gap-1 text-xs text-destructive">
                      <AlertCircle className="w-3 h-3" />
                      <span>{validationErrors.baths}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sqft-manual">Sqft</Label>
                  <Input
                    id="sqft-manual"
                    placeholder="1,800"
                    value={sqft}
                    onChange={(e) => {
                      setSqft(e.target.value);
                      if (validationErrors.sqft) {
                        setValidationErrors((prev) => {
                          const newErrors = { ...prev };
                          delete newErrors.sqft;
                          return newErrors;
                        });
                      }
                    }}
                    type="number"
                    className={validationErrors.sqft ? 'border-destructive' : ''}
                  />
                  {validationErrors.sqft && (
                    <div className="flex items-center gap-1 text-xs text-destructive">
                      <AlertCircle className="w-3 h-3" />
                      <span>{validationErrors.sqft}</span>
                    </div>
                  )}
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
