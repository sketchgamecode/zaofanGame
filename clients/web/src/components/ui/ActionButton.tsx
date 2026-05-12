import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';

type ActionButtonProps = PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement> & {
  quiet?: boolean;
}>;

export function ActionButton({ children, className, quiet = false, ...props }: ActionButtonProps) {
  const classes = ['action-button', quiet ? 'action-button--quiet' : '', className ?? ''].filter(Boolean).join(' ');

  return (
    <button className={classes} type="button" {...props}>
      {children}
    </button>
  );
}
