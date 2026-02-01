import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Plus, Home, Users, Calendar, Star, Copy, ChevronRight, Pencil } from 'lucide-react';
import CreateSessionDialog from '@/components/showings/CreateSessionDialog';
import EditSessionDialog from '@/components/showings/EditSessionDialog';
import AdminLayout from '@/components/layout/AdminLayout';
import { toast } from 'sonner';
import { format } from 'date-fns';

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
  property_count?: number;
  rating_count?: number;
}

const ShowingHub = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<ShowingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<ShowingSession | null>(null);

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
          created_at
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

  const handleCreateSession = async (data: {
    title: string;
    sessionDate?: Date;
    clientName: string;
    notes?: string;
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('showing_sessions').insert({
        admin_id: user.id,
        title: data.title,
        session_date: data.sessionDate?.toISOString().split('T')[0] || null,
        client_name: data.clientName,
        notes: data.notes || null,
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
          session_date: data.sessionDate?.toISOString().split('T')[0] || null,
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

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground mb-1">
              Showing Hub
            </h1>
            <p className="text-muted-foreground">
              Manage your showing sessions
            </p>
          </div>
        </div>

        {/* New Session Button */}
        <Button
          onClick={() => setIsCreateOpen(true)}
          className="w-full sm:w-auto mb-8 h-14 bg-primary text-primary-foreground font-semibold uppercase tracking-wide gap-2"
        >
          <Plus className="w-5 h-5" />
          New Showing Session
        </Button>

        {/* Sessions List */}
        {loading ? (
          <div className="text-center py-16 text-muted-foreground">
            Loading sessions...
          </div>
        ) : sessions.length > 0 ? (
          <div className="space-y-4">
            {sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => navigate(`/admin/session/${session.id}`)}
                className="bg-card rounded-xl p-5 card-elevated cursor-pointer hover:bg-card/80 transition-colors"
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
                      {session.session_date && (
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(session.session_date), 'M/d/yyyy')}
                        </span>
                      )}
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
                  </div>
                  <div className="flex items-center gap-2">
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
                      onClick={(e) => handleDuplicate(session, e)}
                      className="text-muted-foreground hover:text-foreground"
                      title="Duplicate session"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-display text-xl font-semibold text-foreground mb-2">
              No sessions yet
            </h3>
            <p className="text-muted-foreground mb-6">
              Create your first showing session to get started
            </p>
            <Button onClick={() => setIsCreateOpen(true)} variant="accent">
              <Plus className="w-4 h-4 mr-2" />
              Create First Session
            </Button>
          </div>
        )}
      </div>

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
    </AdminLayout>
  );
};

export default ShowingHub;
