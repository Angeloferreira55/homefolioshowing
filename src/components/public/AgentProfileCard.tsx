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
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
          {/* Agent Avatar & Basic Info */}
          <div className="flex flex-row sm:flex-col items-center sm:items-start gap-4 sm:flex-shrink-0">
            <Avatar className="w-20 h-20 sm:w-32 sm:h-32 border-4 border-background shadow-lg flex-shrink-0">
              <AvatarImage
                src={agent.avatar_url || undefined}
                alt={agent.full_name || 'Agent'}
                className="object-cover"
              />
              <AvatarFallback className="text-xl sm:text-3xl bg-primary/10 text-primary">
                {getInitials(agent.full_name)}
              </AvatarFallback>
            </Avatar>

            {/* Mobile: Name & slogan next to avatar */}
            <div className="sm:hidden flex-1 min-w-0">
              <h3 className="font-display text-lg font-semibold text-foreground truncate">
                {agent.full_name || 'Your Agent'}
              </h3>
              {agent.slogan && (
                <p className="text-primary font-medium text-sm italic line-clamp-2">
                  "{agent.slogan}"
                </p>
              )}
            </div>
          </div>

          {/* Agent Details */}
          <div className="flex-[2] text-center sm:text-left">
            {/* Desktop: Name & slogan */}
            <div className="hidden sm:block">
              <h3 className="font-display text-xl font-semibold text-foreground">
                {agent.full_name || 'Your Agent'}
              </h3>
              {agent.slogan && (
                <p className="text-primary font-medium mt-1 italic">
                  "{agent.slogan}"
                </p>
              )}
            </div>

            {agent.bio && (
              <p className="text-muted-foreground mt-2 sm:mt-3 text-sm sm:text-base leading-relaxed">
                {agent.bio}
              </p>
            )}

            {/* Contact Info - Mobile only */}
            <div className="sm:hidden flex flex-wrap items-center justify-center gap-3 mt-3 text-sm">
              {agent.phone && (
                <a
                  href={`tel:${agent.phone}`}
                  className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors touch-target"
                >
                  <Phone className="w-4 h-4" />
                  <span className="text-xs">{agent.phone}</span>
                </a>
              )}
              {agent.email && (
                <a
                  href={`mailto:${agent.email}`}
                  className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors touch-target"
                >
                  <Mail className="w-4 h-4 flex-shrink-0" />
                  <span className="text-xs break-all">{agent.email}</span>
                </a>
              )}
            </div>

            {/* Social Links - Mobile only */}
            {hasSocialLinks && (
              <div className="sm:hidden flex flex-wrap items-center justify-center gap-2 mt-3">
                {agent.linkedin_url && (
                  <a
                    href={agent.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors touch-target"
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
                    className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors touch-target"
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
                    className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors touch-target"
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
                    className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors touch-target"
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
                    className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors touch-target"
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
                    className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors touch-target"
                    aria-label="Website"
                  >
                    <Globe className="w-4 h-4" />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Brokerage Info & Contact (Tablet+) */}
          <div className="flex flex-col items-center sm:items-end gap-2 sm:gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 sm:border-l border-border sm:pl-6">
            {/* Brokerage Logo & Name */}
            {hasBrokerageInfo && (
              <>
                {agent.brokerage_logo_url ? (
                  <img
                    src={agent.brokerage_logo_url}
                    alt={agent.brokerage_name || 'Brokerage'}
                    className="h-10 sm:h-12 max-w-[100px] sm:max-w-[120px] object-contain"
                  />
                ) : (
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-muted flex items-center justify-center">
                    <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground" />
                  </div>
                )}

                {agent.brokerage_name && (
                  <p className="font-medium text-xs sm:text-sm text-foreground text-center sm:text-right">
                    {agent.brokerage_name}
                  </p>
                )}

                <div className="flex flex-col items-center sm:items-end gap-1 text-xs text-muted-foreground">
                  {agent.brokerage_address && (
                    <span className="flex items-center gap-1 text-center sm:text-right">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <span className="line-clamp-1">{agent.brokerage_address}</span>
                    </span>
                  )}
                  {agent.brokerage_phone && (
                    <a href={`tel:${agent.brokerage_phone}`} className="flex items-center gap-1 hover:text-foreground touch-target">
                      <Phone className="w-3 h-3" />
                      {agent.brokerage_phone}
                    </a>
                  )}
                </div>

                {/* Divider between brokerage and agent contact */}
                <div className="hidden sm:block w-full h-px bg-border my-1" />
              </>
            )}

            {/* Agent Contact Info - Tablet+ only */}
            <div className="hidden sm:flex flex-col items-end gap-2 text-sm w-full">
              {agent.phone && (
                <a
                  href={`tel:${agent.phone}`}
                  className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  <span className="text-sm">{agent.phone}</span>
                </a>
              )}
              {agent.email && (
                <a
                  href={`mailto:${agent.email}`}
                  className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors w-full"
                >
                  <Mail className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm break-all text-right">{agent.email}</span>
                </a>
              )}
            </div>

            {/* Social Links - Tablet+ only */}
            {hasSocialLinks && (
              <div className="hidden sm:flex flex-wrap items-center justify-end gap-2 mt-1 w-full">
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
        </div>
      </CardContent>
    </Card>
  );
}
