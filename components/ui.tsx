import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "@/components/icons";

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description: ReactNode; actions?: ReactNode }) {
  return <div className="page-header"><div>{eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}<h1>{title}</h1><p className="page-description">{description}</p></div>{actions ? <div className="page-actions">{actions}</div> : null}</div>;
}

export function EmptyState({ icon = "search", title, description, action, children }: { icon?: string; title: string; description: string; action?: { href: string; label: string }; children?: ReactNode }) {
  return <div className="empty-state"><div className="empty-orbit" aria-hidden="true"><span /><div><Icon name={icon} className="h-7 w-7" /></div></div><h2>{title}</h2><p>{description}</p>{action ? <Link href={action.href} className="button-primary">{action.label}<Icon name="arrow" className="h-4 w-4" /></Link> : null}{children}</div>;
}
