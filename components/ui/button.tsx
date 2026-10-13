import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost';
}

export function Button({ className, variant = 'default', ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'px-4 py-2.5 rounded-sm font-medium transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed text-xs',
        'focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[var(--accent)]',
        variant === 'default' && 'bg-[var(--accent)] text-[var(--foreground)] hover:opacity-90 active:opacity-80 font-semibold border border-[var(--accent)]',
        variant === 'outline' && 'border border-[var(--border)] bg-white text-[var(--foreground)] hover:bg-[var(--muted)]',
        variant === 'ghost' && 'text-[var(--foreground)] hover:bg-[var(--muted)]',
        className
      )}
      {...props}
    />
  );
}
