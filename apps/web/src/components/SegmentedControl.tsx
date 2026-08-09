import { Fragment } from "react";
import styles from "./SegmentedControl.module.css";

interface SegmentedControlProps<T extends string> {
  name: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  "aria-label": string;
}

export function SegmentedControl<T extends string>({
  name,
  options,
  value,
  onChange,
  "aria-label": ariaLabel,
}: SegmentedControlProps<T>) {
  return (
    <div className={styles.group} role="tablist" aria-label={ariaLabel}>
      {options.map((opt) => {
        const id = `${name}-${opt.value}`;
        return (
          <Fragment key={opt.value}>
            <input
              className={styles.radio}
              type="radio"
              name={name}
              id={id}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
            />
            <label
              className={styles.tab}
              htmlFor={id}
              role="tab"
              aria-selected={value === opt.value}
              // Inline, not a CSS-module .active class: computed style for
              // a class toggled by a controlled-radio state change proved
              // unreliable to verify against this component's actual
              // rendered output (className/checked were correct; the
              // resulting background color wasn't, and stayed wrong across
              // fresh, separately-issued style reads). Driving the one
              // property that actually communicates selection directly
              // from React state removes any cascade/caching ambiguity.
              style={
                value === opt.value
                  ? { background: "var(--fg)", color: "var(--bg)", boxShadow: "0 1px 1px rgba(0,0,0,.2), 0 8px 18px -10px rgba(0,0,0,.5)" }
                  : undefined
              }
            >
              {opt.label}
            </label>
          </Fragment>
        );
      })}
    </div>
  );
}
