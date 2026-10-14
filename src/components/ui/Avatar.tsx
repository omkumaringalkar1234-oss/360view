import { cn } from '@/utils/helpers';
import { getInitials } from '@/utils/helpers';

export interface AvatarProps {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  shape?: 'circle' | 'square';
}

export function Avatar({ src, alt, name, size = 'md', className, shape = 'circle' }: AvatarProps) {
  const sizes = {
    xs: 'h-6 w-6 text-xs',
    sm: 'h-8 w-8 text-sm',
    md: 'h-10 w-10 text-base',
    lg: 'h-12 w-12 text-lg',
    xl: 'h-16 w-16 text-xl',
  };

  const shapes = {
    circle: 'rounded-full',
    square: 'rounded-xl',
  };

  const hasImage = src && src.length > 0;

  return (
    <div
      className={cn(
        'inline-flex items-center justify-center font-medium bg-dark-700 text-dark-100 overflow-hidden',
        sizes[size],
        shapes[shape],
        className
      )}
      role="img"
      aria-label={name || alt || 'Avatar'}
    >
      {hasImage ? (
        <img
          src={src}
          alt={alt || name || 'Avatar'}
          className="h-full w-full object-cover"
        />
      ) : (
        <span>{getInitials(name)}</span>
      )}
    </div>
  );
}

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  dot?: boolean;
}

export function Badge({ children, variant = 'default', size = 'md', className, dot = false }: BadgeProps) {
  const variants = {
    default: 'bg-dark-700 text-dark-200 border border-dark-600',
    success: 'bg-green-500/20 text-green-300 border border-green-500/30',
    warning: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
    error: 'bg-red-500/20 text-red-300 border border-red-500/30',
    info: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
    outline: 'bg-transparent text-dark-300 border border-dark-500',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium rounded-full border',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {dot && (
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full',
            variant === 'success' && 'bg-green-400',
            variant === 'warning' && 'bg-yellow-400',
            variant === 'error' && 'bg-red-400',
            variant === 'info' && 'bg-blue-400',
            variant === 'default' && 'bg-dark-400',
            variant === 'outline' && 'bg-dark-400'
          )}
        />
      )}
      {children}
    </span>
  );
}

export interface SeparatorProps {
  className?: string;
  orientation?: 'horizontal' | 'vertical';
  decorative?: boolean;
}

export function Separator({ className, orientation = 'horizontal', decorative = true }: SeparatorProps) {
  return (
    <hr
      className={cn(
        'border-dark-700',
        orientation === 'horizontal' ? 'w-full' : 'h-full',
        className
      )}
      aria-orientation={orientation}
      role={decorative ? 'none' : 'separator'}
    />
  );
}