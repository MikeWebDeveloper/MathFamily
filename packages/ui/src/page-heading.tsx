import type { ReactNode } from "react";

interface PageHeadingProps {
  children: ReactNode;
  className?: string;
}

export function PageHeading({ children, className }: PageHeadingProps) {
  return (
    <h1 className={`text-h1 font-bold tracking-tight text-balance text-ink ${className ?? ""}`.trimEnd()}>
      {children}
    </h1>
  );
}
