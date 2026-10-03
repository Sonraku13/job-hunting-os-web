import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn('bg-gray-900 border border-gray-800 rounded-lg p-6', className)}
      {...props}
    />
  );
}
