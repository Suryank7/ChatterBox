import { Avatar as ShadcnAvatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface AvatarProps {
  username: string;
  size?: 'sm' | 'md' | 'lg';
  showOnline?: boolean;
  isOnline?: boolean;
  className?: string;
}

export function Avatar({ username, size = 'md', showOnline, isOnline, className = '' }: AvatarProps) {
  const sizeClasses = {
    sm: 'h-10 w-10',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
  };

  const dotSizes = {
    sm: 'h-2.5 w-2.5',
    md: 'h-3 w-3',
    lg: 'h-4 w-4',
  };

  const getInitials = (name: string) => {
    return name.slice(0, 2).toUpperCase();
  };

  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random&size=128`;

  return (
    <div className={`relative ${className}`}>
      <ShadcnAvatar className={sizeClasses[size]}>
        <AvatarImage src={avatarUrl} alt={username} />
        <AvatarFallback className="bg-primary text-primary-foreground font-medium">
          {getInitials(username)}
        </AvatarFallback>
      </ShadcnAvatar>
      {showOnline && (
        <span 
          className={`absolute bottom-0 right-0 ${dotSizes[size]} rounded-full border-2 border-background ${
            isOnline ? 'bg-status-online' : 'bg-status-offline'
          }`}
        />
      )}
    </div>
  );
}
