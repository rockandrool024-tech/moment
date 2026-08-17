import Link from "next/link";
import { ReactNode } from "react";
import styles from "./EmptyState.module.css";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  body: string;
  action?: { label: string; href: string };
}

// Replaces every bare "No X yet." line in the app — see
// docs/design-system.md §3.7 for the full copy table this was spec'd from.
export function EmptyState({ icon, title, body, action }: EmptyStateProps) {
  return (
    <div className={styles.wrap}>
      <div className={styles.icon}>{icon}</div>
      <p className={styles.title}>{title}</p>
      <p className={styles.body}>{body}</p>
      {action && (
        <Link href={action.href} className="btn">
          {action.label}
        </Link>
      )}
    </div>
  );
}
