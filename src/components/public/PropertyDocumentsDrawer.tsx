import { useState } from 'react';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { FileText, Download, X } from 'lucide-react';

export type PublicDoc = {
  id: string;
  name: string;
  doc_type: string | null;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyAddress: string;
  documents: PublicDoc[];
  onOpen: (doc: PublicDoc) => Promise<void> | void;
  onDownload: (doc: PublicDoc) => Promise<void> | void;
};

function truncateMiddle(text: string, max: number) {
  if (text.length <= max) return text;
  const keep = Math.max(6, Math.floor((max - 3) / 2));
  return `${text.slice(0, keep)}...${text.slice(-keep)}`;
}

function getDocTypeLabel(type: string | null) {
  const labels: Record<string, string> = {
    disclosure: 'Disclosure',
    inspection: 'Inspection',
    floor_plan: 'Floor Plan',
    hoa: 'HOA',
    survey: 'Survey',
    title: 'Title',
    other: 'Document',
  };
  return labels[type || 'other'] || 'Document';
}

export default function PropertyDocumentsDrawer({
  open,
  onOpenChange,
  propertyAddress,
  documents,
  onOpen,
  onDownload,
}: Props) {
  const [busyId, setBusyId] = useState<string | null>(null);

  const handleOpen = async (doc: PublicDoc) => {
    setBusyId(doc.id);
    try {
      await onOpen(doc);
    } finally {
      setBusyId(null);
    }
  };

  const handleDownload = async (doc: PublicDoc) => {
    setBusyId(doc.id);
    try {
      await onDownload(doc);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2"
            onClick={() => onOpenChange(false)}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </Button>

          <DrawerHeader className="pb-3">
            <DrawerTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Property Documents
            </DrawerTitle>
            <DrawerDescription className="text-balance">
              {propertyAddress}
            </DrawerDescription>
          </DrawerHeader>

          <div className="px-4 pb-6">
            <div className="space-y-2">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center gap-3 rounded-lg border bg-card px-3 py-3"
                >
                  <button
                    type="button"
                    className="flex flex-1 items-center gap-3 text-left"
                    onClick={() => handleOpen(doc)}
                    disabled={busyId === doc.id}
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted text-muted-foreground">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-foreground">
                        {truncateMiddle(doc.name, 42)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {getDocTypeLabel(doc.doc_type)}
                      </div>
                    </div>
                  </button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => handleDownload(doc)}
                    disabled={busyId === doc.id}
                    aria-label="Download"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
