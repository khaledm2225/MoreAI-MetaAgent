import { useState, type ComponentPropsWithoutRef, type DragEvent } from 'react';
import { Icon } from '../Icon/Icon';
import styles from './PhotoPicker.module.css';

const ACCEPTED = 'image/jpeg,image/png,image/webp';

export interface PhotoPickerProps extends Omit<ComponentPropsWithoutRef<'label'>, 'onDrop'> {
  readonly label: string;
  readonly hint: string;
  readonly onPick: (photo: File) => void;
}

/** Chooses a photo from files or the camera, or by dropping it here. */
export function PhotoPicker({ label, hint, onPick, className, ...rest }: PhotoPickerProps) {
  const [dragging, setDragging] = useState(false);

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    setDragging(false);
    const photo = event.dataTransfer.files[0];
    if (photo !== undefined) {
      onPick(photo);
    }
  }

  return (
    <label
      {...rest}
      data-dragging={dragging}
      className={[styles.picker, className].filter(Boolean).join(' ')}
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      <Icon name="camera" size="2rem" />
      <span className={styles.label}>{label}</span>
      <span className={styles.hint}>{hint}</span>
      <input
        type="file"
        accept={ACCEPTED}
        aria-label={label}
        className={styles.input}
        onChange={(event) => {
          const photo = event.target.files?.[0];
          if (photo !== undefined) {
            onPick(photo);
          }
          event.target.value = '';
        }}
      />
    </label>
  );
}
