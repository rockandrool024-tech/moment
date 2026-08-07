"use client";

import { useState } from "react";

export function StarRating({
  value,
  onRate,
  readOnly = false,
}: {
  value: number;
  onRate?: (score: number) => void;
  readOnly?: boolean;
}) {
  const [hover, setHover] = useState(0);

  return (
    <div style={{ display: "flex", gap: 4 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => !readOnly && onRate?.(star)}
          onMouseEnter={() => !readOnly && setHover(star)}
          onMouseLeave={() => !readOnly && setHover(0)}
          style={{
            background: "none",
            border: "none",
            fontSize: 28,
            minWidth: 44,
            minHeight: 44,
            cursor: readOnly ? "default" : "pointer",
            color: star <= (hover || value) ? "#e8b93f" : "#d9d9d9",
            transition: "color 0.15s",
            padding: 0,
            lineHeight: 1,
          }}
          aria-label={`${star} star${star !== 1 ? "s" : ""}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
