import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost';
}

export function Button({ className, variant = 'default', ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'px-4 py-2.5 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent focus:ring-blue-500',
        variant === 'default' && 'bg-white text-black hover:bg-gray-200',
        variant === 'outline' && 'border border-gray-700 bg-transparent hover:bg-gray-800/50',
        variant === 'ghost' && 'hover:bg-gray-800/30',
        className
      )}
      {...props}
    />
  );
}
