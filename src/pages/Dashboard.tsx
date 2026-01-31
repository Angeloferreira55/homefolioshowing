import { useState } from 'react';
import { Link } from 'react-router-dom';
import { mockHomefolios, mockAgent } from '@/lib/mockData';
import { Homefolio, ClientType } from '@/types/homefolio';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ClientCard from '@/components/dashboard/ClientCard';
import CreateClientDialog from '@/components/dashboard/CreateClientDialog';
import { Plus, Search, Home, LogOut, User } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

const Dashboard = () => {
  const [homefolios, setHomefolios] = useState<Homefolio[]>(mockHomefolios);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const filteredHomefolios = homefolios.filter((hf) =>
    hf.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    hf.clientNickname?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateClient = (data: { name: string; nickname?: string; type: ClientType }) => {
    const newHomefolio: Homefolio = {
      id: Date.now().toString(),
      clientName: data.name,
      clientNickname: data.nickname,
      clientType: data.type,
      privateLink: `${data.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now().toString(36)}`,
      properties: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setHomefolios((prev) => [newHomefolio, ...prev]);
    toast.success('Client Homefolio created!');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Home className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-display text-xl font-semibold text-foreground">
                HomeFolio
              </span>
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2">
                  <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                    <User className="w-4 h-4 text-accent" />
                  </div>
                  <span className="hidden sm:inline">{mockAgent.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground mb-1">
              Client Hub
            </h1>
            <p className="text-muted-foreground">
              Manage your client homefolios and property collections
            </p>
          </div>
          <Button variant="accent" onClick={() => setIsCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Client
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 text-base"
          />
        </div>

        {/* Client Grid */}
        {filteredHomefolios.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredHomefolios.map((homefolio) => (
              <ClientCard key={homefolio.id} homefolio={homefolio} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <Home className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-display text-xl font-semibold text-foreground mb-2">
              {searchQuery ? 'No clients found' : 'No clients yet'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery
                ? 'Try adjusting your search query'
                : 'Create your first client homefolio to get started'}
            </p>
            {!searchQuery && (
              <Button variant="accent" onClick={() => setIsCreateOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Client
              </Button>
            )}
          </div>
        )}
      </main>

      <CreateClientDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onCreate={handleCreateClient}
      />
    </div>
  );
};

export default Dashboard;
