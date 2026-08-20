import { ReactNode } from "react";
import { CheckIcon, TierCrownIcon } from "@/components/icons";
import styles from "./OutcomeTicket.module.css";

interface OutcomeTicketProps {
  brandLabel: string;
  outcome: string;
  creator: ReactNode;
  tier: string;
  payout: string;
  ticketId: string;
}

export function OutcomeTicket({ brandLabel, outcome, creator, tier, payout, ticketId }: OutcomeTicketProps) {
  return (
    <details className={styles.ticket}>
      <summary className={styles.summary}>
        <div className={styles.header}>
          <span className={styles.logo}>PK</span>
          <span><strong>PEROKIO</strong><small>{brandLabel}</small></span>
        </div>
        <div className={styles.mystery}><span>?</span><small>Tap to reveal</small></div>
        <div className={styles.stub}><span className={styles.barcode} aria-hidden /><code>{ticketId}</code></div>
      </summary>
      <div className={styles.reveal}>
        <div className={styles.revealHead}><TierCrownIcon width={24} height={24} aria-hidden /><span>Outcome verified</span></div>
        <div className={styles.grid}>
          <div><small>Creator</small><strong>{creator}</strong></div>
          <div><small>Outcome</small><strong>{outcome}</strong></div>
          <div><small>Tier</small><strong>{tier}</strong></div>
          <div><small>Payout</small><strong>{payout}</strong></div>
        </div>
        <div className={styles.verified}><CheckIcon width={15} height={15} aria-hidden />Live campaign record · {ticketId}</div>
      </div>
    </details>
  );
}
