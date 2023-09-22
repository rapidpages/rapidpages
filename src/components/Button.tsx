import Link from "next/link";
import clsx from "clsx";

const baseStyles = {
  primary:
    "inline-flex items-center border border-transparent bg-indigo-600 font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2",
  secondary:
    "inline-flex items-center border border-transparent bg-indigo-100 font-medium text-indigo-700 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2",
  white:
    "inline-flex items-center border border-gray-300 bg-white font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2",
};

const buttonSizes = {
  xs: "rounded px-2.5 py-1.5 text-xs",
  sm: "rounded-md px-3 py-2 text-sm leading-4",
  normal: "rounded-md px-4 py-2 text-sm",
  lg: "rounded-md px-4 py-2 text-base",
  xl: "rounded-md px-6 py-3 text-base",
};

type ButtonTypes = HTMLAnchorElement | HTMLButtonElement;

interface ButtonProps<T extends ButtonTypes>
  extends React.ButtonHTMLAttributes<T>,
    React.AnchorHTMLAttributes<T> {
  variant?: "primary" | "secondary" | "white";
  size?: "xs" | "sm" | "normal" | "lg" | "xl";
  href?: string;
  type?: "submit" | "reset" | "button";
}

// TODO: button or link - fix later
export const Button = ({
  variant = "primary",
  size = "normal",
  className,
  href,
  ...props
}: ButtonProps<ButtonTypes>) => {
  className = clsx(baseStyles[variant], buttonSizes[size], className);

  return href ? (
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    <Link
      href={href}
      className={className}
      {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
    />
  ) : (
    <button
      className={className}
      {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
    />
  );
};
