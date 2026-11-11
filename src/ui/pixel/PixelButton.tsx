import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

interface PixelButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: ButtonVariant;
  readonly fullWidth?: boolean;
  readonly children: ReactNode;
}

export function PixelButton({
  variant = "primary",
  fullWidth = false,
  className,
  children,
  type = "button",
  ...rest
}: PixelButtonProps) {
  const classes = [
    "pixel-button",
    `pixel-button--${variant}`,
    fullWidth ? "pixel-button--full" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button className={classes} type={type} {...rest}>
      {children}
    </button>
  );
}
