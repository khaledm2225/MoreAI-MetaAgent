import { useId, useLayoutEffect, useRef, type KeyboardEvent, type ReactNode, type SyntheticEvent } from 'react';
import styles from './Dialog.module.css';

export interface DialogProps {
  readonly open: boolean;
  readonly title: string;
  readonly onClose: () => void;
  /** Buttons at the end, such as confirm and cancel. */
  readonly actions?: ReactNode;
  readonly children: ReactNode;
  readonly className?: string;
}

/**
 * A question that holds the screen until it's answered, built on the browser's own
 * `dialog`, so focus stays inside it and the rest of the page goes inert.
 */
export function Dialog({ open, ...rest }: DialogProps) {
  return open ? <OpenDialog {...rest} /> : null;
}

function OpenDialog({ title, onClose, actions, children, className }: Omit<DialogProps, 'open'>) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useLayoutEffect(() => {
    const element = dialog.current;
    if (element === null) {
      return;
    }
    const opener = document.activeElement;
    if (typeof element.showModal === 'function') {
      element.showModal();
    } else {
      element.setAttribute('open', '');
    }
    if (!element.contains(document.activeElement)) {
      element.focus();
    }
    return () => {
      if (typeof element.close === 'function') {
        element.close();
      }
      if (opener instanceof HTMLElement) {
        opener.focus();
      }
    };
  }, []);

  // The parent decides, so what's on screen always matches its state.
  function requestClose(event: SyntheticEvent) {
    event.preventDefault();
    onClose();
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      requestClose(event);
    }
  }

  return (
    <dialog
      ref={dialog}
      tabIndex={-1}
      aria-labelledby={titleId}
      data-ground="plain"
      className={[styles.dialog, className].filter(Boolean).join(' ')}
      onCancel={requestClose}
      onKeyDown={handleKeyDown}
    >
      <div className={styles.layout}>
        <h2 id={titleId} className={styles.title}>
          {title}
        </h2>
        {children}
        {actions}
      </div>
    </dialog>
  );
}
