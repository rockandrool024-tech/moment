"use client";

import React from "react";
import styles from "./StatCard.module.css";

interface StatCardProps {
  label: string;
  value: string | number;
  verdict?: { text: string; tone: "good" | "warn" | "bad" };
  icon?: React.ReactNode;
}

export function StatCard({ label, value, verdict, icon }: StatCardProps) {
  return (
    <div className={styles.card}>
      {icon && <div className={styles.icon}>{icon}</div>}
      <p className={styles.label}>{label}</p>
      <div className={styles.value}>{value}</div>
      {verdict && (
        <span className={`${styles.verdict} ${styles[`verdict-${verdict.tone}`]}`}>
          {verdict.text}
        </span>
      )}
    </div>
  );
}
