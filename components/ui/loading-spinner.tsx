import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'button' | 'overlay';
  className?: string;
  text?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12',
};

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'default',
  className,
  text,
}) => {
  const baseClasses = 'animate-spin';
  const sizeClass = sizeClasses[size];

  if (variant === 'overlay') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="flex flex-col items-center space-y-2">
          <Loader2 className={cn(baseClasses, sizeClasses.lg, 'text-primary')} />
          {text && <p className="text-sm text-muted-foreground font-pixel">{text}</p>}
        </div>
      </div>
    );
  }

  if (variant === 'button') {
    return (
      <Loader2 className={cn(baseClasses, sizeClass, 'text-current', className)} />
    );
  }

  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div className="flex flex-col items-center space-y-2">
        <Loader2 className={cn(baseClasses, sizeClass, 'text-primary')} />
        {text && <p className="text-sm text-muted-foreground font-pixel">{text}</p>}
      </div>
    </div>
  );
};

export default LoadingSpinner; 