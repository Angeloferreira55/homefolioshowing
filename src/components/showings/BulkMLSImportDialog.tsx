import { useState, useRef } from 'react';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription,
} from '@/components/ui/responsive-dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, FileText, X, Loader2, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';

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

interface FileUploadStatus {
  file: File;
  status: 'pending' | 'uploading' | 'parsing' | 'success' | 'error';
  error?: string;
  properties?: PropertyData[];
}

interface BulkMLSImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (properties: PropertyData[]) => void;
}

const BulkMLSImportDialog = ({ open, onOpenChange, onImport }: BulkMLSImportDialogProps) => {
  const [files, setFiles] = useState<FileUploadStatus[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;

    const newFiles: FileUploadStatus[] = [];
    
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      // Only accept PDFs for MLS sheets
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        // Check for duplicates
        const isDuplicate = files.some(f => f.file.name === file.name && f.file.size === file.size);
        if (!isDuplicate) {
          newFiles.push({
            file,
            status: 'pending',
          });
        }
      } else {
        toast.error(`${file.name} is not a PDF file`);
      }
    }

    if (newFiles.length > 0) {
      setFiles(prev => [...prev, ...newFiles]);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const clearAllFiles = () => {
    setFiles([]);
    setProcessedCount(0);
  };

  const processFiles = async () => {
    if (files.length === 0) return;

    setIsProcessing(true);
    setProcessedCount(0);

    const allProperties: PropertyData[] = [];
    const updatedFiles = [...files];

    for (let i = 0; i < updatedFiles.length; i++) {
      const fileStatus = updatedFiles[i];
      
      // Skip already processed files
      if (fileStatus.status === 'success') {
        setProcessedCount(prev => prev + 1);
        continue;
      }

      try {
        // Update status to uploading
        updatedFiles[i] = { ...fileStatus, status: 'uploading' };
        setFiles([...updatedFiles]);

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('Please sign in to upload files');
        }

        // Upload file to storage
        const filePath = `${user.id}/${Date.now()}-${fileStatus.file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('mls-uploads')
          .upload(filePath, fileStatus.file);

        if (uploadError) {
          throw new Error(uploadError.message);
        }

        // Update status to parsing
        updatedFiles[i] = { ...fileStatus, status: 'parsing' };
        setFiles([...updatedFiles]);

        // Parse the file
        const { data, error } = await supabase.functions.invoke('parse-mls-file', {
          body: { filePath, fileType: 'pdf' },
        });

        if (error) {
          throw new Error(error.message);
        }

        if (!data.success) {
          throw new Error(data.error || 'Failed to parse file');
        }

        const properties = data.data as PropertyData[];
        
        if (properties.length === 0) {
          throw new Error('No properties found in the file');
        }

        // Success
        updatedFiles[i] = { 
          ...fileStatus, 
          status: 'success', 
          properties 
        };
        allProperties.push(...properties);
        
      } catch (error: any) {
        console.error(`Error processing ${fileStatus.file.name}:`, error);
        updatedFiles[i] = { 
          ...fileStatus, 
          status: 'error', 
          error: error.message || 'Failed to process file' 
        };
      }

      setFiles([...updatedFiles]);
      setProcessedCount(prev => prev + 1);
    }

    setIsProcessing(false);

    const successCount = updatedFiles.filter(f => f.status === 'success').length;
    const errorCount = updatedFiles.filter(f => f.status === 'error').length;

    if (successCount > 0) {
      toast.success(`Successfully processed ${successCount} file${successCount > 1 ? 's' : ''}`);
    }
    if (errorCount > 0) {
      toast.error(`${errorCount} file${errorCount > 1 ? 's' : ''} failed to process`);
    }
  };

  const handleImportAll = () => {
    const allProperties: PropertyData[] = [];
    
    files.forEach(fileStatus => {
      if (fileStatus.status === 'success' && fileStatus.properties) {
        allProperties.push(...fileStatus.properties);
      }
    });

    if (allProperties.length === 0) {
      toast.error('No properties to import');
      return;
    }

    onImport(allProperties);
    clearAllFiles();
    onOpenChange(false);
    toast.success(`Imported ${allProperties.length} propert${allProperties.length > 1 ? 'ies' : 'y'}!`);
  };

  const getSuccessfulPropertyCount = () => {
    return files.reduce((acc, f) => {
      if (f.status === 'success' && f.properties) {
        return acc + f.properties.length;
      }
      return acc;
    }, 0);
  };

  const getStatusIcon = (status: FileUploadStatus['status']) => {
    switch (status) {
      case 'pending':
        return <FileText className="w-5 h-5 text-muted-foreground" />;
      case 'uploading':
      case 'parsing':
        return <Loader2 className="w-5 h-5 text-primary animate-spin" />;
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-destructive" />;
    }
  };

  const getStatusText = (fileStatus: FileUploadStatus) => {
    switch (fileStatus.status) {
      case 'pending':
        return 'Waiting...';
      case 'uploading':
        return 'Uploading...';
      case 'parsing':
        return 'Extracting data...';
      case 'success':
        return `${fileStatus.properties?.length || 0} propert${(fileStatus.properties?.length || 0) > 1 ? 'ies' : 'y'} found`;
      case 'error':
        return fileStatus.error || 'Error';
    }
  };

  const progress = files.length > 0 ? (processedCount / files.length) * 100 : 0;
  const hasSuccessfulFiles = files.some(f => f.status === 'success');
  const allFilesProcessed = files.length > 0 && files.every(f => f.status === 'success' || f.status === 'error');

  return (
    <ResponsiveDialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen && !isProcessing) {
        clearAllFiles();
      }
      if (!isProcessing) {
        onOpenChange(isOpen);
      }
    }}>
      <ResponsiveDialogContent className="sm:max-w-lg">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle className="font-display text-2xl">
            Bulk Import MLS Sheets
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Upload multiple MLS PDF files to import properties at once.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <div className="space-y-4 mt-4">
          {/* Drop Zone */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            disabled={isProcessing}
          />
          
          <div
            onClick={() => !isProcessing && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              isProcessing 
                ? 'border-muted cursor-not-allowed opacity-50' 
                : 'border-muted-foreground/25 cursor-pointer hover:border-primary/50'
            }`}
          >
            <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="font-medium">Click to select PDF files</p>
            <p className="text-xs text-muted-foreground mt-1">
              You can select multiple MLS sheets at once
            </p>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  {files.length} file{files.length > 1 ? 's' : ''} selected
                </p>
                {!isProcessing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFiles}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Clear all
                  </Button>
                )}
              </div>

              {isProcessing && (
                <div className="space-y-1">
                  <Progress value={progress} className="h-2" />
                  <p className="text-xs text-muted-foreground text-center">
                    Processing {processedCount} of {files.length}...
                  </p>
                </div>
              )}

              <ScrollArea className="h-[200px] rounded-md border">
                <div className="p-2 space-y-2">
                  {files.map((fileStatus, index) => (
                    <div
                      key={`${fileStatus.file.name}-${index}`}
                      className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg"
                    >
                      {getStatusIcon(fileStatus.status)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {fileStatus.file.name}
                        </p>
                        <p className={`text-xs ${
                          fileStatus.status === 'error' 
                            ? 'text-destructive' 
                            : fileStatus.status === 'success'
                            ? 'text-green-600'
                            : 'text-muted-foreground'
                        }`}>
                          {getStatusText(fileStatus)}
                        </p>
                      </div>
                      {fileStatus.status === 'pending' && !isProcessing && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 flex-shrink-0"
                          onClick={() => removeFile(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            
            {!allFilesProcessed ? (
              <Button
                className="flex-1"
                onClick={processFiles}
                disabled={files.length === 0 || isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Process {files.length} File{files.length > 1 ? 's' : ''}
                  </>
                )}
              </Button>
            ) : hasSuccessfulFiles ? (
              <Button
                className="flex-1"
                onClick={handleImportAll}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Import {getSuccessfulPropertyCount()} Propert{getSuccessfulPropertyCount() > 1 ? 'ies' : 'y'}
              </Button>
            ) : (
              <Button
                className="flex-1"
                onClick={clearAllFiles}
                variant="outline"
              >
                Try Again
              </Button>
            )}
          </div>
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
};

export default BulkMLSImportDialog;
