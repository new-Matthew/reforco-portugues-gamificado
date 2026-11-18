import type { ButtonHTMLAttributes, MouseEventHandler, ReactNode } from "react";
import { playSoundEffect } from "../sound/soundManager";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

interface PixelButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: ButtonVariant;
  readonly fullWidth?: boolean;
  readonly sound?: "click" | "none";
  readonly children: ReactNode;
}

export function PixelButton({
  variant = "primary",
  fullWidth = false,
  sound = "click",
  className,
  children,
  type = "button",
  onClick,
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

  const handleClick: MouseEventHandler<HTMLButtonElement> = (event) => {
    if (sound !== "none") playSoundEffect("click");
    onClick?.(event);
  };

  return (
    <button className={classes} type={type} onClick={handleClick} {...rest}>
      {children}
    </button>
  );
}
