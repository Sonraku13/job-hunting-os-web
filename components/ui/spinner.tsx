interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
}

export function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  const sizeClasses = {
    sm: 'w-3 h-3 border-[2px]',
    md: 'w-8 h-8 border-[3px]',
    lg: 'w-12 h-12 border-[4px]',
  };

  return (
    <div
      className={className}
      role="status"
      aria-label="Loading..."
    >
      <div className={`${sizeClasses[size]} animate-spin rounded-full border-current border-white/20 border-t-transparent`} />
    </div>
  );
}