import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Home, Users, Calendar, Star, Copy, ChevronRight, Pencil, Trash2, Archive, RotateCcw, Clock } from 'lucide-react';
import CreateSessionDialog from '@/components/showings/CreateSessionDialog';
import EditSessionDialog from '@/components/showings/EditSessionDialog';
import AdminLayout from '@/components/layout/AdminLayout';
import SessionListSkeleton from '@/components/skeletons/SessionListSkeleton';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';

interface ShowingSession {
  id: string;
  title: string;
  client_name: string;
  client_email?: string | null;
  client_phone?: string | null;
  session_date: string | null;
  share_token: string;
  created_at: string;
  notes?: string | null;
  deleted_at?: string | null;
  archived_at?: string | null;
  property_count?: number;
  rating_count?: number;
}

type SessionTab = 'active' | 'archived' | 'trash';

const ShowingHub = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<ShowingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<ShowingSession | null>(null);
  const [deletingSession, setDeletingSession] = useState<ShowingSession | null>(null);
  const [permanentDeleteSession, setPermanentDeleteSession] = useState<ShowingSession | null>(null);
  const [activeTab, setActiveTab] = useState<SessionTab>('active');

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const { data: sessionsData, error } = await supabase
        .from('showing_sessions')
        .select(`
          id,
          title,
          client_name,
          client_email,
          client_phone,
          session_date,
          share_token,
          notes,
          created_at,
          deleted_at,
          archived_at
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch property counts for each session
      const sessionsWithCounts = await Promise.all(
        (sessionsData || []).map(async (session) => {
          const { count: propertyCount } = await supabase
            .from('session_properties')
            .select('*', { count: 'exact', head: true })
            .eq('session_id', session.id);

          const { count: ratingCount } = await supabase
            .from('property_ratings')
            .select('*', { count: 'exact', head: true })
            .eq('session_property_id', session.id);

          return {
            ...session,
            property_count: propertyCount || 0,
            rating_count: ratingCount || 0,
          };
        })
      );

      setSessions(sessionsWithCounts);
    } catch (error: any) {
      toast.error('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  // Filter sessions by tab
  const activeSessions = sessions.filter(s => !s.deleted_at && !s.archived_at);
  const archivedSessions = sessions.filter(s => !s.deleted_at && s.archived_at);
  const trashedSessions = sessions.filter(s => s.deleted_at);

  // Helper to format date as YYYY-MM-DD without timezone shift
  const formatDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleCreateSession = async (data: {
    title: string;
    sessionDate?: Date;
    clientName: string;
    notes?: string;
    sharePassword?: string;
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('showing_sessions').insert({
        admin_id: user.id,
        title: data.title,
        session_date: data.sessionDate ? formatDateString(data.sessionDate) : null,
        client_name: data.clientName,
        notes: data.notes || null,
        share_password: data.sharePassword || null,
      });

      if (error) throw error;

      toast.success('Session created!');
      fetchSessions();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create session');
    }
  };

  const handleDuplicate = async (session: ShowingSession, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('showing_sessions').insert({
        admin_id: user.id,
        title: `${session.title} (Copy)`,
        session_date: session.session_date,
        client_name: session.client_name,
      });

      if (error) throw error;

      toast.success('Session duplicated!');
      fetchSessions();
    } catch (error: any) {
      toast.error('Failed to duplicate session');
    }
  };

  const handleEditSession = (session: ShowingSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSession(session);
  };

  const handleDeleteClick = (session: ShowingSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingSession(session);
  };

  // Soft delete - moves to trash
  const handleConfirmDelete = async () => {
    if (!deletingSession) return;

    try {
      const { error } = await supabase.rpc('soft_delete_session', {
        p_session_id: deletingSession.id
      });

      if (error) throw error;

      toast.success('Session moved to trash');
      fetchSessions();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete session');
    } finally {
      setDeletingSession(null);
    }
  };

  // Restore from trash
  const handleRestore = async (session: ShowingSession, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const { error } = await supabase.rpc('restore_session', {
        p_session_id: session.id
      });

      if (error) throw error;

      toast.success('Session restored!');
      fetchSessions();
    } catch (error: any) {
      toast.error(error.message || 'Failed to restore session');
    }
  };

  // Permanent delete
  const handlePermanentDelete = async () => {
    if (!permanentDeleteSession) return;

    try {
      const { error } = await supabase
        .from('showing_sessions')
        .delete()
        .eq('id', permanentDeleteSession.id);

      if (error) throw error;

      toast.success('Session permanently deleted');
      fetchSessions();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete session');
    } finally {
      setPermanentDeleteSession(null);
    }
  };

  // Archive session
  const handleArchive = async (session: ShowingSession, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const { error } = await supabase.rpc('archive_session', {
        p_session_id: session.id
      });

      if (error) throw error;

      toast.success('Session archived');
      fetchSessions();
    } catch (error: any) {
      toast.error(error.message || 'Failed to archive session');
    }
  };

  // Unarchive session
  const handleUnarchive = async (session: ShowingSession, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const { error } = await supabase.rpc('unarchive_session', {
        p_session_id: session.id
      });

      if (error) throw error;

      toast.success('Session restored to active');
      fetchSessions();
    } catch (error: any) {
      toast.error(error.message || 'Failed to unarchive session');
    }
  };

  const handleSaveSession = async (data: {
    title: string;
    clientName: string;
    sessionDate?: Date;
    notes?: string;
  }) => {
    if (!editingSession) return;

    try {
      const { error } = await supabase
        .from('showing_sessions')
        .update({
          title: data.title,
          client_name: data.clientName,
          session_date: data.sessionDate ? formatDateString(data.sessionDate) : null,
          notes: data.notes || null,
        })
        .eq('id', editingSession.id);

      if (error) throw error;

      toast.success('Session updated!');
      fetchSessions();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update session');
      throw error;
    }
  };

  const getDaysUntilPermanentDelete = (deletedAt: string) => {
    const deleteDate = new Date(deletedAt);
    const expiryDate = new Date(deleteDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    const now = new Date();
    const daysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, daysLeft);
  };

  const renderSessionCard = (session: ShowingSession, variant: 'active' | 'archived' | 'trash') => (
    <div
      key={session.id}
      onClick={() => variant !== 'trash' && navigate(`/admin/session/${session.id}`)}
      className={`bg-card rounded-xl p-5 card-elevated transition-colors ${
        variant === 'trash' ? 'opacity-75' : 'cursor-pointer hover:bg-card/80'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-display text-xl font-semibold text-foreground mb-1">
            {session.title}
          </h3>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              {session.client_name}
            </span>
            {session.session_date && (() => {
              const [year, month, day] = session.session_date.split('-').map(Number);
              const localDate = new Date(year, month - 1, day);
              return (
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  {format(localDate, 'M/d/yyyy')}
                </span>
              );
            })()}
          </div>
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Home className="w-3.5 h-3.5" />
              {session.property_count} properties
            </span>
            <span className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5" />
              {session.rating_count} ratings
            </span>
          </div>
          {variant === 'trash' && session.deleted_at && (
            <div className="flex items-center gap-1 mt-2 text-sm text-destructive">
              <Clock className="w-3.5 h-3.5" />
              Permanently deleted in {getDaysUntilPermanentDelete(session.deleted_at)} days
            </div>
          )}
          {variant === 'archived' && session.archived_at && (
            <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
              <Archive className="w-3.5 h-3.5" />
              Archived {formatDistanceToNow(new Date(session.archived_at), { addSuffix: true })}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {variant === 'active' && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => handleEditSession(session, e)}
                className="text-muted-foreground hover:text-foreground"
                title="Edit session"
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => handleArchive(session, e)}
                className="text-muted-foreground hover:text-foreground"
                title="Archive session"
              >
                <Archive className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => handleDuplicate(session, e)}
                className="text-muted-foreground hover:text-foreground"
                title="Duplicate session"
              >
                <Copy className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => handleDeleteClick(session, e)}
                className="text-muted-foreground hover:text-destructive"
                title="Move to trash"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </>
          )}
          {variant === 'archived' && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => handleUnarchive(session, e)}
                className="text-muted-foreground hover:text-foreground"
                title="Restore to active"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => handleDeleteClick(session, e)}
                className="text-muted-foreground hover:text-destructive"
                title="Move to trash"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </>
          )}
          {variant === 'trash' && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => handleRestore(session, e)}
                className="text-muted-foreground hover:text-foreground"
                title="Restore session"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  setPermanentDeleteSession(session);
                }}
                className="text-muted-foreground hover:text-destructive"
                title="Delete permanently"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <AdminLayout>
      <>
        <PageHeader 
          title="Showing Hub" 
          description="Manage your showing sessions"
          icon={Calendar}
        />

        {/* New Session Button */}
        <Button
          onClick={() => setIsCreateOpen(true)}
          className="w-full sm:w-auto mb-6 h-14 bg-primary text-primary-foreground font-semibold uppercase tracking-wide gap-2"
        >
          <Plus className="w-5 h-5" />
          New Home Folio
        </Button>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as SessionTab)} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="active" className="gap-2">
              <Home className="w-4 h-4" />
              Active ({activeSessions.length})
            </TabsTrigger>
            <TabsTrigger value="archived" className="gap-2">
              <Archive className="w-4 h-4" />
              Archived ({archivedSessions.length})
            </TabsTrigger>
            <TabsTrigger value="trash" className="gap-2">
              <Trash2 className="w-4 h-4" />
              Trash ({trashedSessions.length})
            </TabsTrigger>
          </TabsList>

           {/* Active Sessions */}
           <TabsContent value="active">
             {loading ? (
               <SessionListSkeleton count={4} />
             ) : activeSessions.length > 0 ? (
               <div className="space-y-4">
                 {activeSessions.map((session) => renderSessionCard(session, 'active'))}
               </div>
             ) : (
               <div className="space-y-8">
                 <EmptyState
                   icon={Calendar}
                   title="No active sessions yet"
                   description="Welcome! Let's get you started with your first HomeFolio showing session."
                   action={{
                     label: "Create First Session",
                     onClick: () => setIsCreateOpen(true),
                   }}
                 />
                 
                 {/* Onboarding Steps */}
                 <div className="bg-card rounded-xl p-8 card-elevated">
                   <h3 className="font-display text-lg font-semibold text-foreground mb-6">
                     Get Started in 3 Steps
                   </h3>
                   <div className="space-y-4">
                     <div className="flex gap-4">
                       <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold text-sm">
                         1
                       </div>
                       <div>
                         <h4 className="font-semibold text-foreground mb-1">Create a Session</h4>
                         <p className="text-sm text-muted-foreground">
                           Start by creating a new showing session with your client's name and optional date.
                         </p>
                       </div>
                     </div>
                     
                     <div className="flex gap-4">
                       <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold text-sm">
                         2
                       </div>
                       <div>
                         <h4 className="font-semibold text-foreground mb-1">Add Properties</h4>
                         <p className="text-sm text-muted-foreground">
                           Add property details, photos, showing times, and documents. Set the order your clients will see them in.
                         </p>
                       </div>
                     </div>
                     
                     <div className="flex gap-4">
                       <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold text-sm">
                         3
                       </div>
                       <div>
                         <h4 className="font-semibold text-foreground mb-1">Share with Clients</h4>
                         <p className="text-sm text-muted-foreground">
                           Generate a shareable link or QR code. Your clients can view properties, see schedules, compare homes, and provide feedback—no app needed.
                         </p>
                       </div>
                     </div>
                   </div>
                   
                   {/* Key Features */}
                   <div className="mt-8 pt-8 border-t border-border">
                     <p className="text-sm font-semibold text-foreground mb-4">What you can do:</p>
                     <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-muted-foreground">
                       <li className="flex items-start gap-2">
                         <span className="text-primary mt-1">✓</span>
                         <span>Organize multiple properties in one session</span>
                       </li>
                       <li className="flex items-start gap-2">
                         <span className="text-primary mt-1">✓</span>
                         <span>Schedule specific times for each property</span>
                       </li>
                       <li className="flex items-start gap-2">
                         <span className="text-primary mt-1">✓</span>
                         <span>Upload documents and photos</span>
                       </li>
                       <li className="flex items-start gap-2">
                         <span className="text-primary mt-1">✓</span>
                         <span>Protect links with optional access codes</span>
                       </li>
                       <li className="flex items-start gap-2">
                         <span className="text-primary mt-1">✓</span>
                         <span>View client feedback and ratings</span>
                       </li>
                       <li className="flex items-start gap-2">
                         <span className="text-primary mt-1">✓</span>
                         <span>Generate QR codes for easy sharing</span>
                       </li>
                     </ul>
                   </div>
                 </div>
               </div>
             )}
           </TabsContent>

          {/* Archived Sessions */}
          <TabsContent value="archived">
            {loading ? (
              <SessionListSkeleton count={4} />
            ) : archivedSessions.length > 0 ? (
              <div className="space-y-4">
                {archivedSessions.map((session) => renderSessionCard(session, 'archived'))}
              </div>
            ) : (
              <EmptyState
                icon={Archive}
                title="No archived sessions"
                description="Archived sessions will appear here. Archive completed sessions to keep your active list clean."
              />
            )}
          </TabsContent>

          {/* Trash */}
          <TabsContent value="trash">
            {loading ? (
              <SessionListSkeleton count={4} />
            ) : trashedSessions.length > 0 ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground mb-4">
                  Items in trash are automatically deleted after 7 days.
                </p>
                {trashedSessions.map((session) => renderSessionCard(session, 'trash'))}
              </div>
            ) : (
              <EmptyState
                icon={Trash2}
                title="Trash is empty"
                description="Deleted sessions will appear here for 7 days before being permanently removed."
              />
            )}
          </TabsContent>
        </Tabs>
      </>

      <CreateSessionDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onCreate={handleCreateSession}
      />

      <EditSessionDialog
        session={editingSession}
        open={!!editingSession}
        onOpenChange={(open) => !open && setEditingSession(null)}
        onSave={handleSaveSession}
      />

      {/* Soft Delete Confirmation */}
      <AlertDialog open={!!deletingSession} onOpenChange={(open) => !open && setDeletingSession(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Move to Trash</AlertDialogTitle>
            <AlertDialogDescription>
              "{deletingSession?.title}" will be moved to trash. You can restore it within 7 days before it's permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Move to Trash
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Permanent Delete Confirmation */}
      <AlertDialog open={!!permanentDeleteSession} onOpenChange={(open) => !open && setPermanentDeleteSession(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Permanently</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete "{permanentDeleteSession?.title}"? This will also remove all properties and ratings associated with this session. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePermanentDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Forever
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default ShowingHub;
