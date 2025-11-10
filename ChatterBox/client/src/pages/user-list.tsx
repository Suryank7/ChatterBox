import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { LogOut, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/lib/auth-context';
import { useWebSocket } from '@/lib/websocket-context';
import { Avatar } from '@/components/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { UserWithStatus } from '@shared/schema';
import { useEffect, useState } from 'react';

export default function UserList() {
  const [, setLocation] = useLocation();
  const { user: currentUser, logout } = useAuth();
  const { socket, isConnected } = useWebSocket();
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  const { data: users, isLoading } = useQuery<UserWithStatus[]>({
    queryKey: ['/api/users'],
  });

  useEffect(() => {
    if (!socket) return;

    socket.on('user:online', (data) => {
      setOnlineUsers(prev => new Set(prev).add(data.userId));
    });

    socket.on('user:offline', (data) => {
      setOnlineUsers(prev => {
        const updated = new Set(prev);
        updated.delete(data.userId);
        return updated;
      });
    });

    socket.on('users:online', (data) => {
      setOnlineUsers(new Set(data.userIds));
    });

    return () => {
      socket.off('user:online');
      socket.off('user:offline');
      socket.off('users:online');
    };
  }, [socket]);

  const handleLogout = () => {
    logout();
    setLocation('/login');
  };

  const handleUserClick = (userId: string, username: string) => {
    setLocation(`/chat/${userId}?username=${encodeURIComponent(username)}`);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen bg-background">
        <header className="flex items-center justify-between p-4 border-b">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </header>
        <main className="flex-1 overflow-y-auto p-4 space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            </Card>
          ))}
        </main>
      </div>
    );
  }

  const filteredUsers = users?.filter(u => u.id !== currentUser?.id) || [];

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="flex items-center justify-between p-4 border-b">
        <div>
          <h1 className="text-2xl font-semibold">Messages</h1>
          <div className="flex items-center gap-2 mt-1">
            <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-status-online' : 'bg-status-offline'}`} />
            <p className="text-sm text-muted-foreground">
              {isConnected ? 'Connected' : 'Connecting...'}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          data-testid="button-logout"
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </header>

      <main className="flex-1 overflow-y-auto">
        {filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Loader2 className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No users yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Other users will appear here once they join the chat
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredUsers.map((user) => {
              const isOnline = onlineUsers.has(user.id);
              
              return (
                <button
                  key={user.id}
                  onClick={() => handleUserClick(user.id, user.username)}
                  className="w-full p-4 hover-elevate active-elevate-2 transition-colors text-left"
                  data-testid={`user-card-${user.id}`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar 
                      username={user.username} 
                      size="md" 
                      showOnline 
                      isOnline={isOnline}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className="font-medium truncate" data-testid={`user-name-${user.id}`}>
                          {user.username}
                        </h3>
                        {user.lastMessage && (
                          <span className="text-xs text-muted-foreground flex-shrink-0">
                            {format(new Date(user.lastMessage.timestamp), 'HH:mm')}
                          </span>
                        )}
                      </div>
                      {user.lastMessage ? (
                        <p className={`text-sm truncate ${
                          user.lastMessage.isRead ? 'text-muted-foreground' : 'text-foreground font-medium'
                        }`}>
                          {user.lastMessage.content}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          {isOnline ? 'Online' : 'Offline'}
                        </p>
                      )}
                    </div>
                    {user.lastMessage && !user.lastMessage.isRead && (
                      <div className="h-5 min-w-[20px] px-1.5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-medium text-primary-foreground">1</span>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
