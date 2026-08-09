import { ReactNode } from "react";
import styles from "./Sheet.module.css";

interface SheetProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

// Standard confirm-step / detail-panel entrance (globals.css .sheet-rise —
// same rise animation as /map's pin sheet) so funding confirmation, rating,
// and anything else that used to just pop in reads as one consistent
// pattern instead of a per-screen one-off.
export function Sheet({ title, onClose, children }: SheetProps) {
  return (
    <>
      <div className={styles.backdrop} onClick={onClose} />
      <div className={`${styles.sheet} sheet-rise`} role="dialog" aria-label={title}>
        <div className={styles.head}>
          <h2 style={{ margin: 0, fontSize: "1.05rem" }}>{title}</h2>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        {children}
      </div>
    </>
  );
}
