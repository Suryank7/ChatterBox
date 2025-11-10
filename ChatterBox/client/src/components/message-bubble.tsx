import { format } from 'date-fns';
import { Check, CheckCheck } from 'lucide-react';
import type { Message } from '@shared/schema';

interface MessageBubbleProps {
  message: Message;
  isSent: boolean;
}

export function MessageBubble({ message, isSent }: MessageBubbleProps) {
  const formattedTime = format(new Date(message.createdAt), 'HH:mm');

  return (
    <div 
      className={`flex mb-2 ${isSent ? 'justify-end' : 'justify-start'}`}
      data-testid={`message-${message.id}`}
    >
      <div 
        className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${
          isSent 
            ? 'bg-primary text-primary-foreground rounded-br-sm' 
            : 'bg-secondary text-secondary-foreground rounded-bl-sm'
        }`}
      >
        <p className="text-[15px] leading-relaxed break-words">{message.content}</p>
        <div className={`flex items-center gap-1 mt-1 ${isSent ? 'justify-end' : 'justify-start'}`}>
          <span className={`text-xs ${isSent ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
            {formattedTime}
          </span>
          {isSent && (
            <span data-testid={`message-status-${message.id}`}>
              {message.isRead ? (
                <CheckCheck className="h-3.5 w-3.5 text-primary-foreground/90" />
              ) : message.isDelivered ? (
                <CheckCheck className="h-3.5 w-3.5 text-primary-foreground/70" />
              ) : (
                <Check className="h-3.5 w-3.5 text-primary-foreground/70" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
