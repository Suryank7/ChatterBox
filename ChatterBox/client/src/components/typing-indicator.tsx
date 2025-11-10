export function TypingIndicator({ username }: { username: string }) {
  return (
    <div className="flex items-start gap-3 mb-2" data-testid="typing-indicator">
      <div className="flex items-center gap-2 bg-secondary px-4 py-2.5 rounded-2xl rounded-bl-sm max-w-[75%]">
        <span className="text-sm text-muted-foreground">{username} is typing</span>
        <div className="flex gap-1">
          <span className="h-1.5 w-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]" />
          <span className="h-1.5 w-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]" />
          <span className="h-1.5 w-1.5 bg-muted-foreground rounded-full animate-bounce" />
        </div>
      </div>
    </div>
  );
}
