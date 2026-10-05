import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn('bg-[var(--card)] border border-[var(--border)] rounded-sm p-6', className)}
      {...props}
    />
  );
}
