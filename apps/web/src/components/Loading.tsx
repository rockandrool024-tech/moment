import styles from "./Loading.module.css";

// Replaces bare "Loading…" text — the fill-sweep bar from
// docs/perokio/component-library.html §05, adapted from a Uiverse
// component the user supplied, ported into real code.
export function Loading({ label = "Loading" }: { label?: string }) {
  return (
    <div className={styles.wrap}>
      <div className={styles.text}>
        {label}
        <span className={styles.dot}>.</span>
        <span className={styles.dot}>.</span>
        <span className={styles.dot}>.</span>
      </div>
      <div className={styles.track}>
        <div className={styles.fill} />
      </div>
    </div>
  );
}
