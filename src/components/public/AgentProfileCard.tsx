import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Building2, Phone, Mail, MapPin, Award, Linkedin, Instagram, Facebook, Youtube, Globe } from 'lucide-react';

// X/Twitter icon (not in lucide-react)
const XIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

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
  linkedin_url?: string | null;
  instagram_url?: string | null;
  facebook_url?: string | null;
  twitter_url?: string | null;
  youtube_url?: string | null;
  website_url?: string | null;
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
  const hasSocialLinks = agent.linkedin_url || agent.instagram_url || agent.facebook_url || agent.twitter_url || agent.youtube_url || agent.website_url;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row gap-6">
          {/* Agent Avatar & Basic Info */}
          <div className="flex flex-col items-center sm:items-start gap-4">
            <Avatar className="w-32 h-32 border-4 border-background shadow-lg">
              <AvatarImage 
                src={agent.avatar_url || undefined} 
                alt={agent.full_name || 'Agent'} 
                className="object-cover"
              />
              <AvatarFallback className="text-3xl bg-primary/10 text-primary">
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

            {agent.bio && (
              <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
                {agent.bio}
              </p>
            )}

            {/* Website Link */}
            {agent.website_url && (
              <a 
                href={agent.website_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-3 text-sm text-accent hover:underline"
              >
                <Globe className="w-4 h-4" />
                {agent.website_url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
              </a>
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

            {/* Social Links */}
            {hasSocialLinks && (
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-4">
                {agent.linkedin_url && (
                  <a 
                    href={agent.linkedin_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                    aria-label="LinkedIn"
                  >
                    <Linkedin className="w-4 h-4" />
                  </a>
                )}
                {agent.instagram_url && (
                  <a 
                    href={agent.instagram_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                    aria-label="Instagram"
                  >
                    <Instagram className="w-4 h-4" />
                  </a>
                )}
                {agent.facebook_url && (
                  <a 
                    href={agent.facebook_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                    aria-label="Facebook"
                  >
                    <Facebook className="w-4 h-4" />
                  </a>
                )}
                {agent.twitter_url && (
                  <a 
                    href={agent.twitter_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                    aria-label="X (Twitter)"
                  >
                    <XIcon className="w-4 h-4" />
                  </a>
                )}
                {agent.youtube_url && (
                  <a 
                    href={agent.youtube_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                    aria-label="YouTube"
                  >
                    <Youtube className="w-4 h-4" />
                  </a>
                )}
                {agent.website_url && (
                  <a 
                    href={agent.website_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                    aria-label="Website"
                  >
                    <Globe className="w-4 h-4" />
                  </a>
                )}
              </div>
            )}
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
