import { Link } from 'react-router-dom';
import { Homefolio } from '@/types/homefolio';
import { formatDate } from '@/lib/mockData';
import { Home, Users, TrendingUp, ExternalLink, MoreHorizontal, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface ClientCardProps {
  homefolio: Homefolio;
}

const clientTypeIcons = {
  buyer: Users,
  seller: Home,
  investor: TrendingUp,
};

const clientTypeLabels = {
  buyer: 'Buyer',
  seller: 'Seller',
  investor: 'Investor',
};

const ClientCard = ({ homefolio }: ClientCardProps) => {
  const Icon = clientTypeIcons[homefolio.clientType];

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/view/${homefolio.privateLink}`);
    toast.success('Link copied to clipboard!');
  };

  return (
    <div className="group bg-card rounded-2xl p-6 card-elevated">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
            <Icon className="w-6 h-6 text-accent" />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold text-foreground">
              {homefolio.clientName}
            </h3>
            {homefolio.clientNickname && (
              <p className="text-sm text-muted-foreground">
                {homefolio.clientNickname}
              </p>
            )}
          </div>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={copyLink}>
              <Copy className="w-4 h-4 mr-2" />
              Copy Link
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to={`/view/${homefolio.privateLink}`} target="_blank">
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Client View
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <span className="px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium">
          {clientTypeLabels[homefolio.clientType]}
        </span>
        <span className="text-sm text-muted-foreground">
          {homefolio.properties.length} {homefolio.properties.length === 1 ? 'property' : 'properties'}
        </span>
      </div>

      {/* Property thumbnails */}
      {homefolio.properties.length > 0 && (
        <div className="flex -space-x-2 mb-4">
          {homefolio.properties.slice(0, 4).map((property, index) => (
            <div
              key={property.id}
              className="w-12 h-12 rounded-lg border-2 border-card overflow-hidden"
              style={{ zIndex: 4 - index }}
            >
              <img
                src={property.photos[0]}
                alt={property.address}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
          {homefolio.properties.length > 4 && (
            <div className="w-12 h-12 rounded-lg border-2 border-card bg-muted flex items-center justify-center">
              <span className="text-xs font-medium text-muted-foreground">
                +{homefolio.properties.length - 4}
              </span>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-border">
        <span className="text-xs text-muted-foreground">
          Updated {formatDate(homefolio.updatedAt)}
        </span>
        <Button variant="ghost" size="sm" asChild>
          <Link to={`/homefolio/${homefolio.id}`}>
            Manage
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default ClientCard;
