import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { AlertCircle, Info, CheckCircle, AlertTriangle, X } from 'lucide-react';

const alertVariants = cva(
  'relative w-full rounded-lg border p-4 text-sm [&>svg]:pointer-events-none [&>svg]:size-4 [&>svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-background border-border text-foreground',
        destructive:
          'bg-destructive/10 border-destructive/30 text-destructive dark:bg-destructive/20',
        success: 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20',
        warning: 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/20',
        info: 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

type AlertVariant = 'default' | 'destructive' | 'success' | 'warning' | 'info';

const icons: Record<AlertVariant, React.ElementType> = {
  default: Info,
  destructive: AlertCircle,
  success: CheckCircle,
  warning: AlertTriangle,
  info: Info,
};

function Alert({
  className,
  variant = 'default' as AlertVariant,
  children,
  title,
  dismissible,
  onDismiss,
  ...props
}: React.ComponentProps<'div'> & {
  variant?: AlertVariant;
  title?: React.ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
}) {
  const Icon = icons[variant];

  return (
    <div
      role="alert"
      data-slot="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    >
      <div className="flex items-start gap-3">
        {Icon && <Icon className="mt-0.5" />}
        <div className="flex-1 min-w-0">
          {title && <h5 className="mb-1 font-medium leading-none">{title}</h5>}
          <p className="leading-relaxed">{children}</p>
        </div>
        {dismissible && (
          <button onClick={onDismiss} className="opacity-70 transition-opacity hover:opacity-100">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export { Alert };
