import { ReactNode } from "react";
import { CheckIcon, VerifiedIcon } from "@/components/icons";
import styles from "./Notice.module.css";

export type NoticeTone = "info" | "success" | "warning" | "danger";

interface NoticeProps {
  tone?: NoticeTone;
  title?: ReactNode;
  children: ReactNode;
  action?: ReactNode;
}

export function Notice({ tone = "info", title, children, action }: NoticeProps) {
  const icon = tone === "success" ? <CheckIcon width={18} height={18} aria-hidden /> : <VerifiedIcon width={18} height={18} aria-hidden />;

  return (
    <div className={`notice notice--${tone}`} role={tone === "danger" ? "alert" : "status"}>
      <span className={`${styles.icon} ${styles[tone]}`}>{icon}</span>
      <div className={styles.copy}>
        {title && <strong className={styles.title}>{title}</strong>}
        <div className="muted">{children}</div>
      </div>
      {action}
    </div>
  );
}
