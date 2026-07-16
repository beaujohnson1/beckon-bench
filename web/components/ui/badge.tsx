import { cn } from '@/lib/utils';

const variants = {
  default: 'border-primary-deep/60 bg-primary/10 text-primary',
  info: 'border-info/40 bg-info/10 text-info',
  warn: 'border-warn/40 bg-warn/10 text-warn',
  outline: 'border-line bg-transparent text-muted',
} as const;

export function Badge({
  className,
  variant = 'default',
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: keyof typeof variants }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-mono text-[0.65rem] font-bold uppercase tracking-widest',
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
