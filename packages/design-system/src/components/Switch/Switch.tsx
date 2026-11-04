import styles from './Switch.module.css';

export interface SwitchProps {
  readonly label: string;
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
  readonly disabled?: boolean;
}

export function Switch({ label, checked, onChange, disabled = false }: SwitchProps) {
  return (
    <label className={styles.row}>
      <span>{label}</span>
      <input
        type="checkbox"
        role="switch"
        className={styles.input}
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  );
}
