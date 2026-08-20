import { ReactNode } from "react";
import { MoreIcon } from "@/components/icons";
import styles from "./Sheet.module.css";

interface SheetProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

export function Sheet({ title, onClose, children, footer }: SheetProps) {
  return (
    <>
      <div className={styles.backdrop} onClick={onClose} aria-hidden />
      <section className={`${styles.sheet} sheet-rise`} role="dialog" aria-modal="true" aria-labelledby="sheet-title">
        <div className={styles.handle} aria-hidden />
        <header className={styles.head}>
          <h2 id="sheet-title">{title}</h2>
          <button type="button" className={`${styles.close} ghost`} onClick={onClose} aria-label="Close dialog">
            <MoreIcon width={20} height={20} aria-hidden />
          </button>
        </header>
        <div className={styles.body}>{children}</div>
        {footer && <footer className={styles.footer}>{footer}</footer>}
      </section>
    </>
  );
}
