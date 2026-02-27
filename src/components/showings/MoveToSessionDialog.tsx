import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { Plus, FolderOutput, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExistingSession {
  id: string;
  title: string;
  session_date: string | null;
  property_count: number;
}

interface MoveToSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  currentSessionId: string;
  sessionType: string;
  currentTitle: string;
  onMoveToExisting: (sessionId: string, sessionTitle: string) => void;
  onMoveToNew: (sessionTitle: string) => void;
}

export function MoveToSessionDialog({
  open,
  onOpenChange,
  selectedCount,
  currentSessionId,
  sessionType,
  currentTitle,
  onMoveToExisting,
  onMoveToNew,
}: MoveToSessionDialogProps) {
  const [sessions, setSessions] = useState<ExistingSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'choose' | 'new'>('choose');
  const [newTitle, setNewTitle] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const isPopBy = sessionType === 'pop_by';
  const label = isPopBy ? 'addresses' : 'properties';

  useEffect(() => {
    if (open) {
      setMode('choose');
      setNewTitle(`${currentTitle} - Day 2`);
      setSelectedSessionId(null);
      fetchSessions();
    }
  }, [open]);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get sessions of same type, excluding current
      const { data: sessionsData } = await supabase
        .from('showing_sessions')
        .select('id, title, session_date')
        .eq('admin_id', user.id)
        .eq('session_type', sessionType)
        .neq('id', currentSessionId)
        .order('created_at', { ascending: false });

      if (!sessionsData) {
        setSessions([]);
        return;
      }

      // Get property counts for each session
      const withCounts = await Promise.all(
        sessionsData.map(async (s) => {
          const { count } = await supabase
            .from('session_properties')
            .select('*', { count: 'exact', head: true })
            .eq('session_id', s.id);
          return { ...s, property_count: count || 0 };
        })
      );

      setSessions(withCounts);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (mode === 'new') {
      if (!newTitle.trim()) return;
      onMoveToNew(newTitle.trim());
    } else if (selectedSessionId) {
      const target = sessions.find(s => s.id === selectedSessionId);
      onMoveToExisting(selectedSessionId, target?.title || '');
    }
    onOpenChange(false);
  };

  const formatDate = (date: string | null) => {
    if (!date) return '';
    try {
      return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <FolderOutput className="w-5 h-5" />
            Move {selectedCount} {selectedCount === 1 ? (isPopBy ? 'address' : 'property') : label}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Create New Session option */}
          <button
            type="button"
            onClick={() => setMode(mode === 'new' ? 'choose' : 'new')}
            className={cn(
              'w-full flex items-center gap-3 p-3 rounded-lg border-2 border-dashed text-left transition-colors',
              mode === 'new'
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/20 hover:border-primary/40'
            )}
          >
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 shrink-0">
              <Plus className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">Create New Session</p>
              <p className="text-xs text-muted-foreground">Start a fresh session with these {label}</p>
            </div>
          </button>

          {mode === 'new' && (
            <div className="space-y-2 pl-1">
              <Label htmlFor="new-session-title">Session Title</Label>
              <Input
                id="new-session-title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Enter session title"
                autoFocus
              />
            </div>
          )}

          {/* Existing sessions */}
          {sessions.length > 0 && (
            <>
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground px-2">or move to existing</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <div className="space-y-1.5 max-h-60 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  sessions.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setSelectedSessionId(s.id === selectedSessionId ? null : s.id);
                        setMode('choose');
                      }}
                      className={cn(
                        'w-full flex items-center justify-between p-3 rounded-lg border text-left transition-colors',
                        selectedSessionId === s.id
                          ? 'border-primary bg-primary/5'
                          : 'border-transparent hover:bg-muted/50'
                      )}
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{s.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {s.property_count} {s.property_count === 1 ? (isPopBy ? 'address' : 'property') : label}
                          {s.session_date && ` · ${formatDate(s.session_date)}`}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </>
          )}

          {!loading && sessions.length === 0 && mode === 'choose' && (
            <p className="text-xs text-muted-foreground text-center py-2">
              No other {isPopBy ? 'pop-by' : ''} sessions found. Create a new one above.
            </p>
          )}

          <Button
            className="w-full"
            disabled={(mode === 'new' && !newTitle.trim()) || (mode === 'choose' && !selectedSessionId)}
            onClick={handleConfirm}
          >
            {mode === 'new'
              ? `Create & Move ${selectedCount} ${label}`
              : selectedSessionId
                ? `Move to "${sessions.find(s => s.id === selectedSessionId)?.title}"`
                : `Select a destination`
            }
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
