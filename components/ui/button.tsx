import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost';
}

export function Button({ className, variant = 'default', ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'px-4 py-2.5 rounded-sm font-medium transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed text-xs',
        'focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#C1EF7B]',
        variant === 'default' && 'bg-[#C1EF7B] text-[#0C0B1E] hover:bg-[#b0e865] active:bg-[#9ed84f] font-semibold border border-[#a8e05a]',
        variant === 'outline' && 'border border-[#C1EF7B] bg-white text-[#0C0B1E] hover:bg-[#F1F0FF]',
        variant === 'ghost' && 'text-[#0C0B1E] hover:bg-[#F1F0FF]',
        className
      )}
      {...props}
    />
  );
}
