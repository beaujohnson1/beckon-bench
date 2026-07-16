import { cn } from '@/lib/utils';

const variants = {
  primary:
    'bg-primary text-[#04140b] font-bold hover:bg-primary-deep shadow-[0_0_18px_rgba(34,242,132,0.25)]',
  outline: 'border border-line bg-panel-2 text-foreground hover:border-primary hover:text-primary',
  ghost: 'text-muted hover:text-foreground',
} as const;

export function Button({
  className,
  variant = 'outline',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof variants }) {
  return (
    <button
      className={cn(
        'inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3.5 py-1.5 font-mono text-xs transition-all disabled:cursor-default disabled:opacity-50',
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
