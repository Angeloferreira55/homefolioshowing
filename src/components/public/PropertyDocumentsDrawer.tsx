import { useState } from 'react';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { FileText, Download, ChevronRight } from 'lucide-react';

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
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="pb-2 text-left">
          <DrawerTitle className="text-lg font-semibold">
            Property Documents
          </DrawerTitle>
          <DrawerDescription className="text-sm text-muted-foreground line-clamp-1">
            {propertyAddress}
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 pb-6 overflow-y-auto">
          <div className="divide-y divide-border">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-3 py-3"
              >
                {/* Tap entire row to open */}
                <button
                  type="button"
                  className="flex flex-1 items-center gap-3 text-left min-w-0"
                  onClick={() => handleOpen(doc)}
                  disabled={busyId === doc.id}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {truncateMiddle(doc.name, 36)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {getDocTypeLabel(doc.doc_type)}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </button>

                {/* Separate download button */}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 shrink-0"
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
      </DrawerContent>
    </Drawer>
  );
}
