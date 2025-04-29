import React from "react";

const Button = React.forwardRef(
  (
    {
      className = "",
      variant = "default",
      size = "default",
      children,
      ...props
    },
    ref
  ) => {
    // Base styles
    const baseStyles =
      "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";

    // Variant styles
    const variantStyles = {
      default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow",
      destructive:
        "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow",
      outline:
        "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      ghost: "hover:bg-accent hover:text-accent-foreground",
      link: "text-primary underline-offset-4 hover:underline",
    };

    // Size styles
    const sizeStyles = {
      default: "h-10 px-4 py-2",
      sm: "h-9 rounded-md px-3",
      lg: "h-11 rounded-md px-8",
      icon: "h-10 w-10",
    };

    // Combine styles
    const buttonStyles = [
      baseStyles,
      variantStyles[variant] || variantStyles.default,
      sizeStyles[size] || sizeStyles.default,
      className,
    ].join(" ");

    return (
      <button className={buttonStyles} ref={ref} {...props}>
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };
