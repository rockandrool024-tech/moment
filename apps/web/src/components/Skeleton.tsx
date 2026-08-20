import styles from "./Skeleton.module.css";

export function SkeletonLine({ width = "100%" }: { width?: string }) {
  return <span className={styles.line} style={{ width }} aria-hidden />;
}

export function CardSkeleton({ media = false }: { media?: boolean }) {
  return (
    <div className={styles.card} aria-hidden>
      {media && <div className={styles.media} />}
      <div className={styles.body}>
        <SkeletonLine width="32%" />
        <SkeletonLine width="78%" />
        <SkeletonLine width="48%" />
      </div>
    </div>
  );
}

export function CardSkeletonList({ count = 3, media = false }: { count?: number; media?: boolean }) {
  return (
    <div className="content-grid" aria-label="Loading content">
      {Array.from({ length: count }, (_, index) => <CardSkeleton key={index} media={media} />)}
    </div>
  );
}
