import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Building2, Phone, Mail, MapPin, Award } from 'lucide-react';

export interface AgentProfile {
  full_name: string | null;
  avatar_url: string | null;
  slogan: string | null;
  bio: string | null;
  phone: string | null;
  email: string;
  license_number: string | null;
  brokerage_name: string | null;
  brokerage_address: string | null;
  brokerage_phone: string | null;
  brokerage_email: string | null;
  brokerage_logo_url: string | null;
}

interface AgentProfileCardProps {
  agent: AgentProfile;
}

export function AgentProfileCard({ agent }: AgentProfileCardProps) {
  const getInitials = (name: string | null) => {
    if (!name) return 'A';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const hasBrokerageInfo = agent.brokerage_name || agent.brokerage_logo_url;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row gap-6">
          {/* Agent Avatar & Basic Info */}
          <div className="flex flex-col items-center sm:items-start gap-4">
            <Avatar className="w-24 h-24 border-4 border-background shadow-lg">
              <AvatarImage src={agent.avatar_url || undefined} alt={agent.full_name || 'Agent'} />
              <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                {getInitials(agent.full_name)}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Agent Details */}
          <div className="flex-1 text-center sm:text-left">
            <h3 className="font-display text-xl font-semibold text-foreground">
              {agent.full_name || 'Your Agent'}
            </h3>
            
            {agent.slogan && (
              <p className="text-primary font-medium mt-1 italic">
                "{agent.slogan}"
              </p>
            )}

            {agent.license_number && (
              <p className="text-sm text-muted-foreground mt-1 flex items-center justify-center sm:justify-start gap-1.5">
                <Award className="w-3.5 h-3.5" />
                {agent.license_number}
              </p>
            )}

            {agent.bio && (
              <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
                {agent.bio}
              </p>
            )}

            {/* Contact Info */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-4 text-sm">
              {agent.phone && (
                <a 
                  href={`tel:${agent.phone}`} 
                  className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  {agent.phone}
                </a>
              )}
              {agent.email && (
                <a 
                  href={`mailto:${agent.email}`} 
                  className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  {agent.email}
                </a>
              )}
            </div>
          </div>

          {/* Brokerage Info */}
          {hasBrokerageInfo && (
            <div className="flex flex-col items-center sm:items-end gap-3 pt-4 sm:pt-0 border-t sm:border-t-0 sm:border-l border-border sm:pl-6">
              {agent.brokerage_logo_url ? (
                <img 
                  src={agent.brokerage_logo_url} 
                  alt={agent.brokerage_name || 'Brokerage'} 
                  className="h-12 max-w-[120px] object-contain"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-muted-foreground" />
                </div>
              )}
              
              {agent.brokerage_name && (
                <p className="font-medium text-sm text-foreground text-center sm:text-right">
                  {agent.brokerage_name}
                </p>
              )}

              <div className="flex flex-col items-center sm:items-end gap-1 text-xs text-muted-foreground">
                {agent.brokerage_address && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {agent.brokerage_address}
                  </span>
                )}
                {agent.brokerage_phone && (
                  <a href={`tel:${agent.brokerage_phone}`} className="flex items-center gap-1 hover:text-foreground">
                    <Phone className="w-3 h-3" />
                    {agent.brokerage_phone}
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
