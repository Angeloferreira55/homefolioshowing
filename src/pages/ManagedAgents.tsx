import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/layout/AdminLayout';
import PageHeader from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useActiveAgent } from '@/hooks/useActiveAgent';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Users, Plus, Pencil, Trash2, Building2, Phone, Mail, Loader2 } from 'lucide-react';
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

const MAX_AGENTS = 5;

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

const ManagedAgents = () => {
  const navigate = useNavigate();
  const { managedAgents, loading, refetchAgents } = useActiveAgent();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const { error } = await (supabase
        .from('managed_agents' as any) as any)
        .delete()
        .eq('id', deleteId);

      if (error) throw error;
      toast.success('Agent profile deleted');
      await refetchAgents();
    } catch (err) {
      console.error('Error deleting agent:', err);
      toast.error('Failed to delete agent profile');
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  const atCapacity = managedAgents.length >= MAX_AGENTS;

  return (
    <AdminLayout>
      <PageHeader
        title="My Agents"
        description="Manage the agent profiles you create sessions for"
        icon={Users}
      />

      {/* Capacity indicator */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-muted-foreground">
          {managedAgents.length} / {MAX_AGENTS} agent profiles
        </p>
        <Button
          onClick={() => navigate('/admin/agents/new')}
          disabled={atCapacity}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Agent
        </Button>
      </div>

      {/* Capacity warning */}
      {atCapacity && (
        <div className="mb-6 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-sm text-amber-700 dark:text-amber-400">
          You've reached the maximum of {MAX_AGENTS} agent profiles.
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : managedAgents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No agent profiles yet</h3>
            <p className="text-muted-foreground text-sm text-center mb-4 max-w-md">
              Create agent profiles for the realtors you work with. Each profile gets its own branding on shared sessions.
            </p>
            <Button onClick={() => navigate('/admin/agents/new')}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Agent
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {managedAgents.map((agent) => (
            <Card key={agent.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Avatar className="h-14 w-14 flex-shrink-0">
                    {agent.avatar_url && (
                      <AvatarImage src={agent.avatar_url} alt={agent.full_name} />
                    )}
                    <AvatarFallback className="text-sm font-medium">
                      {getInitials(agent.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">
                      {agent.full_name}
                    </h3>
                    {agent.brokerage_name && (
                      <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
                        <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{agent.brokerage_name}</span>
                      </div>
                    )}
                    {agent.phone && (
                      <div className="flex items-center gap-1.5 mt-0.5 text-sm text-muted-foreground">
                        <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{agent.phone}</span>
                      </div>
                    )}
                    {agent.email && (
                      <div className="flex items-center gap-1.5 mt-0.5 text-sm text-muted-foreground">
                        <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{agent.email}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 mt-4 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => navigate(`/admin/agents/${agent.id}`)}
                  >
                    <Pencil className="w-3.5 h-3.5 mr-1.5" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeleteId(agent.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Agent Profile</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this agent profile. Sessions created for this agent will retain their data but will display your profile instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default ManagedAgents;
