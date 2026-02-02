import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/layout/AdminLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { 
  Eye, 
  Home, 
  Star, 
  FileText, 
  Share2, 
  TrendingUp,
  Users,
  Activity,
} from 'lucide-react';
import { format, subDays, startOfDay, eachDayOfInterval } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

const Analytics = () => {
  const [dateRange] = useState(30);

  const { data: events, isLoading } = useQuery({
    queryKey: ['analytics-events', dateRange],
    queryFn: async () => {
      const startDate = subDays(new Date(), dateRange).toISOString();
      const { data, error } = await supabase
        .from('analytics_events')
        .select('*')
        .gte('created_at', startDate)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  const { data: sessions } = useQuery({
    queryKey: ['analytics-sessions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('showing_sessions')
        .select('id, title, client_name');
      
      if (error) throw error;
      return data || [];
    },
  });

  // Calculate metrics
  const metrics = {
    totalViews: events?.filter(e => e.event_type === 'session_view').length || 0,
    propertyViews: events?.filter(e => e.event_type === 'property_view').length || 0,
    ratings: events?.filter(e => e.event_type === 'property_rating').length || 0,
    docViews: events?.filter(e => e.event_type === 'document_view').length || 0,
    shares: events?.filter(e => e.event_type === 'session_share').length || 0,
    uniqueSessions: new Set(events?.map(e => e.session_id).filter(Boolean)).size,
  };

  // Daily activity chart data
  const dailyData = (() => {
    const days = eachDayOfInterval({
      start: subDays(new Date(), dateRange - 1),
      end: new Date(),
    });

    return days.map(day => {
      const dayStart = startOfDay(day);
      const dayEvents = events?.filter(e => {
        const eventDate = startOfDay(new Date(e.created_at));
        return eventDate.getTime() === dayStart.getTime();
      }) || [];

      return {
        date: format(day, 'MMM d'),
        views: dayEvents.filter(e => e.event_type === 'session_view').length,
        properties: dayEvents.filter(e => e.event_type === 'property_view').length,
        ratings: dayEvents.filter(e => e.event_type === 'property_rating').length,
      };
    });
  })();

  // Event type distribution
  const eventDistribution = [
    { name: 'Session Views', value: metrics.totalViews },
    { name: 'Property Views', value: metrics.propertyViews },
    { name: 'Ratings', value: metrics.ratings },
    { name: 'Doc Views', value: metrics.docViews },
  ].filter(d => d.value > 0);

  // Top sessions by engagement
  const sessionEngagement = (() => {
    const sessionCounts: Record<string, number> = {};
    events?.forEach(e => {
      if (e.session_id) {
        sessionCounts[e.session_id] = (sessionCounts[e.session_id] || 0) + 1;
      }
    });

    return Object.entries(sessionCounts)
      .map(([sessionId, count]) => {
        const session = sessions?.find(s => s.id === sessionId);
        return {
          name: session?.client_name || 'Unknown',
          title: session?.title || 'Unknown Session',
          events: count,
        };
      })
      .sort((a, b) => b.events - a.events)
      .slice(0, 5);
  })();

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <PageHeader
            icon={Activity}
            title="Analytics"
            description="Track engagement and performance"
          />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-80" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader
          icon={Activity}
          title="Analytics"
          description="Track client engagement and property performance"
        />

        {/* Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Session Views</span>
              </div>
              <p className="text-2xl font-bold mt-1">{metrics.totalViews}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Home className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Property Views</span>
              </div>
              <p className="text-2xl font-bold mt-1">{metrics.propertyViews}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Ratings</span>
              </div>
              <p className="text-2xl font-bold mt-1">{metrics.ratings}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Doc Views</span>
              </div>
              <p className="text-2xl font-bold mt-1">{metrics.docViews}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Shares</span>
              </div>
              <p className="text-2xl font-bold mt-1">{metrics.shares}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Active Sessions</span>
              </div>
              <p className="text-2xl font-bold mt-1">{metrics.uniqueSessions}</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <Tabs defaultValue="activity" className="space-y-4">
          <TabsList>
            <TabsTrigger value="activity">
              <TrendingUp className="w-4 h-4 mr-2" />
              Activity
            </TabsTrigger>
            <TabsTrigger value="distribution">
              <Activity className="w-4 h-4 mr-2" />
              Distribution
            </TabsTrigger>
            <TabsTrigger value="sessions">
              <Users className="w-4 h-4 mr-2" />
              Top Sessions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Daily Activity (Last {dateRange} Days)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailyData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }}
                        className="text-muted-foreground"
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        className="text-muted-foreground"
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="views" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        name="Session Views"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="properties" 
                        stroke="hsl(var(--chart-2))" 
                        strokeWidth={2}
                        name="Property Views"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="ratings" 
                        stroke="hsl(var(--chart-3))" 
                        strokeWidth={2}
                        name="Ratings"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="distribution">
            <Card>
              <CardHeader>
                <CardTitle>Event Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80 flex items-center justify-center">
                  {eventDistribution.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={eventDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          outerRadius={120}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {eventDistribution.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-muted-foreground">No events recorded yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sessions">
            <Card>
              <CardHeader>
                <CardTitle>Top Sessions by Engagement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  {sessionEngagement.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={sessionEngagement} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis type="number" />
                        <YAxis 
                          dataKey="name" 
                          type="category" 
                          width={100}
                          tick={{ fontSize: 12 }}
                        />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                        />
                        <Bar dataKey="events" fill="hsl(var(--primary))" radius={4} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-muted-foreground">No session data yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default Analytics;
