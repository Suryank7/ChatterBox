import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation, useRoute } from 'wouter';
import { ArrowLeft, Send } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useWebSocket } from '@/lib/websocket-context';
import { Avatar } from '@/components/avatar';
import { MessageBubble } from '@/components/message-bubble';
import { TypingIndicator } from '@/components/typing-indicator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { Message } from '@shared/schema';

export default function Chat() {
  const [, params] = useRoute('/chat/:userId');
  const [, setLocation] = useLocation();
  const { user: currentUser } = useAuth();
  const { socket } = useWebSocket();
  const { toast } = useToast();
  
  const [messageInput, setMessageInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserOnline, setOtherUserOnline] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const userId = params?.userId;
  const urlParams = new URLSearchParams(window.location.search);
  const otherUsername = urlParams.get('username') || 'User';

  const conversationId = [currentUser?.id, userId].sort().join('-');

  const { data: fetchedMessages, isLoading } = useQuery<Message[]>({
    queryKey: ['/api/conversations', conversationId, 'messages'],
    enabled: !!userId && !!currentUser,
  });

  useEffect(() => {
    if (fetchedMessages) {
      setMessages(fetchedMessages);
    }
  }, [fetchedMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    if (!socket || !userId) return;

    socket.on('message:new', (data) => {
      const newMessage = data.message;
      if (newMessage.conversationId === conversationId) {
        setMessages(prev => [...prev, newMessage]);
        
        if (newMessage.senderId === userId) {
          socket.emit('message:read', {
            messageId: newMessage.id,
            conversationId,
          });
        }
      }
    });

    socket.on('typing:start', (data) => {
      if (data.userId === userId) {
        setIsTyping(true);
      }
    });

    socket.on('typing:stop', (data) => {
      if (data.userId === userId) {
        setIsTyping(false);
      }
    });

    socket.on('message:read', (data) => {
      if (data.conversationId === conversationId) {
        setMessages(prev => prev.map(msg => 
          msg.id === data.messageId ? { ...msg, isRead: true } : msg
        ));
      }
    });

    socket.on('message:delivered', (data) => {
      if (data.conversationId === conversationId) {
        setMessages(prev => prev.map(msg => 
          msg.id === data.messageId ? { ...msg, isDelivered: true } : msg
        ));
      }
    });

    socket.on('user:online', (data) => {
      if (data.userId === userId) {
        setOtherUserOnline(true);
      }
    });

    socket.on('user:offline', (data) => {
      if (data.userId === userId) {
        setOtherUserOnline(false);
      }
    });

    return () => {
      socket.off('message:new');
      socket.off('typing:start');
      socket.off('typing:stop');
      socket.off('message:read');
      socket.off('message:delivered');
      socket.off('user:online');
      socket.off('user:offline');
    };
  }, [socket, userId, conversationId]);

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest('POST', '/api/messages', {
        receiverId: userId,
        content,
      });
    },
    onSuccess: (newMessage) => {
      setMessages(prev => [...prev, newMessage]);
      if (socket) {
        socket.emit('message:send', {
          message: newMessage,
          recipientId: userId,
        });
      }
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to send message',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!messageInput.trim() || sendMessageMutation.isPending) return;

    sendMessageMutation.mutate(messageInput);
    setMessageInput('');
    
    if (socket) {
      socket.emit('typing:stop', { recipientId: userId, conversationId });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);
    
    if (socket) {
      socket.emit('typing:start', { recipientId: userId, conversationId });
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing:stop', { recipientId: userId, conversationId });
      }, 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen bg-background">
        <header className="flex items-center gap-3 p-4 border-b">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-5 w-32 mb-2" />
            <Skeleton className="h-3 w-20" />
          </div>
        </header>
        <main className="flex-1 p-4 space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className={`h-16 ${i % 2 === 0 ? 'ml-auto' : ''} max-w-[75%]`} />
          ))}
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="flex items-center gap-3 p-4 border-b">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation('/users')}
          data-testid="button-back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Avatar username={otherUsername} size="sm" showOnline isOnline={otherUserOnline} />
        <div className="flex-1">
          <h2 className="font-medium" data-testid="chat-username">{otherUsername}</h2>
          <p className="text-xs text-muted-foreground" data-testid="user-status">
            {otherUserOnline ? 'Online' : 'Offline'}
          </p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4" data-testid="messages-container">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-muted-foreground">No messages yet</p>
              <p className="text-sm text-muted-foreground mt-1">Send a message to start the conversation</p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isSent={message.senderId === currentUser?.id}
              />
            ))}
            {isTyping && <TypingIndicator username={otherUsername} />}
            <div ref={messagesEndRef} />
          </>
        )}
      </main>

      <footer className="border-t p-3">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            value={messageInput}
            onChange={handleInputChange}
            placeholder="Type a message..."
            className="flex-1 rounded-full h-11 px-4"
            data-testid="input-message"
          />
          <Button
            type="submit"
            size="icon"
            className="rounded-full h-11 w-11 flex-shrink-0"
            disabled={!messageInput.trim() || sendMessageMutation.isPending}
            data-testid="button-send"
          >
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </footer>
    </div>
  );
}
