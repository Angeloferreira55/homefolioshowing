import { useActiveAgent } from '@/hooks/useActiveAgent';
import { useProfile } from '@/hooks/useProfile';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function AgentSwitcher() {
  const { managedAgents, activeAgentId, setActiveAgentId, isAssistantMode } = useActiveAgent();
  const { profile } = useProfile();

  if (!isAssistantMode) return null;

  return (
    <div className="flex items-center gap-1.5 sm:gap-2 px-2 overflow-x-auto">
      {/* TC's own avatar — "My Sessions" */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => setActiveAgentId(null)}
            className={cn(
              'flex-shrink-0 rounded-full ring-2 ring-offset-2 ring-offset-background transition-all',
              activeAgentId === null
                ? 'ring-primary scale-110'
                : 'ring-transparent hover:ring-muted-foreground/30'
            )}
          >
            <Avatar className="h-9 w-9">
              {profile?.avatar_url && (
                <AvatarImage src={profile.avatar_url} alt="My sessions" />
              )}
              <AvatarFallback className="text-xs font-medium">
                {profile?.full_name ? getInitials(profile.full_name) : 'ME'}
              </AvatarFallback>
            </Avatar>
          </button>
        </TooltipTrigger>
        <TooltipContent>My Sessions</TooltipContent>
      </Tooltip>

      {/* Divider */}
      <div className="h-6 w-px bg-border flex-shrink-0" />

      {/* Managed agent avatars */}
      {managedAgents.map((agent) => (
        <Tooltip key={agent.id}>
          <TooltipTrigger asChild>
            <button
              onClick={() => setActiveAgentId(agent.id)}
              className={cn(
                'flex-shrink-0 rounded-full ring-2 ring-offset-2 ring-offset-background transition-all',
                activeAgentId === agent.id
                  ? 'ring-primary scale-110'
                  : 'ring-transparent hover:ring-muted-foreground/30'
              )}
            >
              <Avatar className="h-9 w-9">
                {agent.avatar_url && (
                  <AvatarImage src={agent.avatar_url} alt={agent.full_name} />
                )}
                <AvatarFallback className="text-xs font-medium">
                  {getInitials(agent.full_name)}
                </AvatarFallback>
              </Avatar>
            </button>
          </TooltipTrigger>
          <TooltipContent>{agent.full_name}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
