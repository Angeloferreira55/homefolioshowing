import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { NavLink } from '@/components/NavLink';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  User,
  LogOut,
  Menu,
  BarChart3,
  Users,
  RotateCcw,
  HelpCircle,
} from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { useSubscription } from '@/hooks/useSubscription';
import { useOnboarding } from '@/hooks/useOnboarding';
import logoImage from '@/assets/homefolio-logo.png';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { AIAssistant } from '@/components/ai/AIAssistant';
import { toast } from 'sonner';

// Admin emails - only these users can see "Manage Users"
const ADMIN_EMAILS = ['angelo@houseforsaleabq.com', 'contact@home-folio.net'];

type NavItem = {
  title: string;
  url: string;
  icon: typeof Calendar;
  adminOnly?: boolean;
  teamLeaderOnly?: boolean;
};

const navItems: NavItem[] = [
  { title: 'Sessions', url: '/admin/showings', icon: Calendar },
  { title: 'Analytics', url: '/admin/analytics', icon: BarChart3 },
  { title: 'Manage Users', url: '/admin/manage-users', icon: Users, adminOnly: true },
  { title: 'Team Management', url: '/admin/team-management', icon: Users, teamLeaderOnly: true },
  { title: 'My Profile', url: '/admin/profile', icon: User },
  { title: 'Help', url: '/admin/help', icon: HelpCircle },
];

function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { profile } = useProfile();
  const { subscribed, tier } = useSubscription();
  const onboarding = useOnboarding();
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const getUserEmail = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUserEmail(session?.user?.email || null);
    };
    getUserEmail();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const handleResetOnboarding = () => {
    onboarding.resetOnboarding();
    toast.success('Onboarding reset! Reload to see the welcome modal.');
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  // Filter nav items based on user role
  const isAdmin = userEmail && ADMIN_EMAILS.includes(userEmail);
  const isTeamLeader = subscribed && (tier === 'team' || tier === 'team5');
  const filteredNavItems = navItems.filter(item => {
    if (item.adminOnly) return isAdmin;
    if (item.teamLeaderOnly) return isTeamLeader;
    return true;
  });

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarContent className="flex flex-col h-full">
        {/* Logo */}
        <div className="p-4 border-b border-border">
          <Link to="/">
            <img 
              src={logoImage} 
              alt="HomeFolio" 
              className={`${collapsed ? 'h-12 w-auto' : 'h-[72px] w-auto'}`}
            />
          </Link>
        </div>

        {/* Navigation */}
        <SidebarGroup className="flex-1">
          <SidebarGroupLabel className={collapsed ? 'sr-only' : ''}>
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredNavItems.map((item) => {
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/50 transition-all border border-transparent"
                        activeClassName="bg-muted text-primary font-medium"
                      >
                        <item.icon className="w-5 h-5 shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* User Section */}
        <div className="mt-auto border-t border-border p-4">
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
            <Avatar className="w-9 h-9 shrink-0">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                {getInitials(profile?.full_name)}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{profile?.full_name || 'User'}</p>
                <p className="text-xs text-muted-foreground truncate">{profile?.email}</p>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size={collapsed ? 'icon' : 'sm'}
            onClick={handleLogout}
            className={`mt-3 ${collapsed ? 'w-9 h-9' : 'w-full justify-start gap-2'}`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Logout</span>}
          </Button>

          {/* Dev-only: Reset Onboarding */}
          {import.meta.env.DEV && (
            <Button
              variant="ghost"
              size={collapsed ? 'icon' : 'sm'}
              onClick={handleResetOnboarding}
              className={`mt-2 ${collapsed ? 'w-9 h-9' : 'w-full justify-start gap-2'} text-muted-foreground hover:text-foreground`}
              title="Reset onboarding (Dev only)"
            >
              <RotateCcw className="w-4 h-4 shrink-0" />
              {!collapsed && <span className="text-xs">Reset Onboarding</span>}
            </Button>
          )}
        </div>
      </SidebarContent>
    </Sidebar>
  );
}

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
      }
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate('/auth');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header with trigger */}
          <header className="sticky top-0 z-40 h-14 border-b border-border bg-background/80 backdrop-blur-md flex items-center justify-between px-4 safe-area-top">
            <SidebarTrigger className="touch-target flex items-center justify-center">
              <Menu className="w-5 h-5" />
            </SidebarTrigger>
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-x-hidden">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
              {children}
            </div>
          </main>
        </div>
      </div>
      <AIAssistant />
    </SidebarProvider>
  );
}
