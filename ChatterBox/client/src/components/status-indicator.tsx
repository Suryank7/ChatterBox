interface StatusIndicatorProps {
  isOnline: boolean;
  size?: 'sm' | 'md';
}

export function StatusIndicator({ isOnline, size = 'sm' }: StatusIndicatorProps) {
  const sizeClass = size === 'sm' ? 'h-2 w-2' : 'h-2.5 w-2.5';
  
  return (
    <span 
      className={`inline-block ${sizeClass} rounded-full ${
        isOnline ? 'bg-status-online' : 'bg-status-offline'
      }`}
    />
  );
}
