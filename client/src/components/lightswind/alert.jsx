import * as React from "react";
import { cn } from "../../lib/utils";
import { AlertCircle, CheckCircle, Info, X, AlertTriangle } from "lucide-react";

const alertVariants = {
  variant: {
    default: "bg-white dark:bg-black text-foreground",
    destructive:
      " border-gray-400 dark:border-gray-700/50 text-red-500  [&>svg]:text-destructive",
    success:
      "border-green-500/50 text-green-700 dark:text-green-500 [&>svg]:text-green-500",
    warning:
      "border-yellow-500/50 text-yellow-700 dark:text-yellow-500 [&>svg]:text-yellow-500",
    info:
      "border-blue-500/50 text-blue-700 dark:text-blue-500 [&>svg]:text-blue-500",
  },
  size: {
    default: "p-4",
    sm: "p-3 text-sm",
    lg: "p-6 text-base"
  }
};

const Alert = React.forwardRef(
  ({ 
    className, 
    variant = "default", 
    size = "default", 
    dismissible = false,
    onDismiss,
    withIcon = false,
    icon,
    duration = 0,
    children,
    ...props 
  }, ref) => {
    const [progress, setProgress] = React.useState(100);
    const [isVisible, setIsVisible] = React.useState(true);

    // Icon mapping based on variant
    const variantIcons = {
      default: <Info className="h-4 w-4" />,
      destructive: <AlertCircle className="h-4 w-4" />,
      success: <CheckCircle className="h-4 w-4" />,
      warning: <AlertTriangle className="h-4 w-4" />,
      info: <Info className="h-4 w-4" />
    };

    const progressColors = {
      default: "bg-blue-500",
      destructive: "bg-red-500",
      success: "bg-green-500",
      warning: "bg-yellow-500",
      info: "bg-blue-500"
    };

    React.useEffect(() => {
      if (duration > 0) {
        const startTime = Date.now();
        const endTime = startTime + duration;

        const interval = setInterval(() => {
          const now = Date.now();
          const remaining = Math.max(0, endTime - now);
          const percent = (remaining / duration) * 100;
          setProgress(percent);

          if (remaining <= 0) {
            clearInterval(interval);
            setIsVisible(false);
            setTimeout(() => {
              if (onDismiss) onDismiss();
            }, 300); // Wait for fade-out animation
          }
        }, 10);

        return () => clearInterval(interval);
      }
    }, [duration, onDismiss]);

    const handleDismiss = () => {
      setIsVisible(false);
      setTimeout(() => {
        if (onDismiss) onDismiss();
      }, 300);
    };

    if (!isVisible) return null;

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(
          "relative w-full rounded-xl border shadow-2xl overflow-hidden transition-all duration-300 transform",
          "animate-slideInRight",
          !isVisible && "opacity-0 scale-95 translate-x-full",
          withIcon && "[&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
          withIcon && "[&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px]",
          alertVariants.variant[variant],
          alertVariants.size[size],
          className
        )}
        {...props}
      >
        <div className="flex items-start gap-4">
          {withIcon && (icon || variantIcons[variant])}
          <div className="flex-1 min-w-0">
            {children}
          </div>
          {dismissible && (
            <button
              className="flex-shrink-0 rounded-full p-1 
              text-foreground/70 opacity-70 
              transition-opacity hover:opacity-100 
              focus:outline-none focus:ring-2 focus:ring-ring 
              focus:ring-offset-2"
              onClick={handleDismiss}
              aria-label="Dismiss alert"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        
        {/* Progress bar */}
        {duration > 0 && (
          <div className="absolute bottom-0 left-0 h-1 w-full bg-background/20 overflow-hidden">
            <div 
              className={cn("h-full transition-all duration-100 ease-linear", progressColors[variant])} 
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
    );
  }
);
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef(({ className, size = "default", ...props }, ref) => {
  const sizeClasses = {
    sm: "text-sm",
    default: "text-base",
    lg: "text-lg"
  };

  return (
    <h5
      ref={ref}
      className={cn("mb-1 font-semibold leading-none tracking-tight", sizeClasses[size], className)}
      {...props}
    />
  );
});
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef(({ className, intensity = "default", ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "text-sm [&_p]:leading-relaxed font-medium opacity-90", 
      intensity === "muted" ? "text-muted-foreground" : "",
      className
    )}
    {...props}
  />
));
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };
