import type { ReactNode } from "react";

export function Panel({
  title,
  icon,
  children,
  wide = false
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <section className={wide ? "panel wide" : "panel"}>
      <div className="panel-title">
        {icon}
        <h3>{title}</h3>
      </div>
      {children}
    </section>
  );
}
