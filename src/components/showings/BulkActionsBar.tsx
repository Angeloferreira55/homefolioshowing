import { Button } from '@/components/ui/button';
import { X, Trash2, CheckSquare, FolderOutput } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface BulkActionsBarProps {
  selectedCount: number;
  onClear: () => void;
  onSelectAll: () => void;
  onDelete: () => void;
  onMoveToNewSession?: () => void;
  totalCount: number;
}

export function BulkActionsBar({
  selectedCount,
  onClear,
  onSelectAll,
  onDelete,
  onMoveToNewSession,
  totalCount,
}: BulkActionsBarProps) {
  if (selectedCount === 0) return null;

  const allSelected = selectedCount === totalCount;

  return (
    <div className="sticky top-0 z-40 bg-primary text-primary-foreground rounded-xl p-4 mb-4 flex items-center justify-between animate-in slide-in-from-top-2 duration-200">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 hover:bg-primary-foreground/10"
          onClick={onClear}
        >
          <X className="w-4 h-4" />
        </Button>
        <span className="font-medium">
          {selectedCount} {selectedCount === 1 ? 'property' : 'properties'} selected
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 hover:bg-primary-foreground/10"
          onClick={allSelected ? onClear : onSelectAll}
        >
          <CheckSquare className="w-4 h-4" />
          {allSelected ? 'Deselect All' : 'Select All'}
        </Button>

        {onMoveToNewSession && (
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 hover:bg-primary-foreground/10"
            onClick={onMoveToNewSession}
          >
            <FolderOutput className="w-4 h-4" />
            <span className="hidden sm:inline">Move to New Session</span>
            <span className="sm:hidden">Move</span>
          </Button>
        )}

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 hover:bg-destructive hover:text-destructive-foreground"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {selectedCount} {selectedCount === 1 ? 'property' : 'properties'}?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently remove the selected {selectedCount === 1 ? 'property' : 'properties'} from this session.
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={onDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete {selectedCount} {selectedCount === 1 ? 'property' : 'properties'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
