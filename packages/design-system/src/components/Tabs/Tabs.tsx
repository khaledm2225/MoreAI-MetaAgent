import type { KeyboardEvent } from 'react';
import styles from './Tabs.module.css';

export interface TabItem {
  readonly id: string;
  readonly label: string;
}

export interface TabsProps {
  readonly label: string;
  readonly tabs: readonly TabItem[];
  readonly selectedId: string;
  readonly onSelect: (id: string) => void;
}

export function Tabs({ label, tabs, selectedId, onSelect }: TabsProps) {
  function handleKeyDown(event: KeyboardEvent) {
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (step === 0) {
      return;
    }
    event.preventDefault();
    // Arrows follow what the eye sees, so they swap for right to left.
    const direction = getComputedStyle(event.currentTarget).direction === 'rtl' ? -step : step;
    const current = tabs.findIndex(({ id }) => id === selectedId);
    const next = tabs[(current + direction + tabs.length) % tabs.length];
    if (next !== undefined) {
      onSelect(next.id);
    }
  }

  return (
    <div role="tablist" aria-label={label} className={styles.tabs} onKeyDown={handleKeyDown}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={tab.id === selectedId}
          tabIndex={tab.id === selectedId ? 0 : -1}
          className={styles.tab}
          onClick={() => onSelect(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
