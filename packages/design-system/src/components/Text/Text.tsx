import { createElement, type ComponentPropsWithoutRef } from 'react';
import styles from './Text.module.css';

export type TextRole =
  | 'hero'
  | 'display'
  | 'title'
  | 'section'
  | 'headline'
  | 'body'
  | 'supporting'
  | 'label'
  | 'caption';

export type TextTone = 'primary' | 'secondary' | 'accent' | 'danger';

export type TextElement = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div' | 'label';

const defaultElement: Record<TextRole, TextElement> = {
  hero: 'h1',
  display: 'h1',
  title: 'h2',
  section: 'h3',
  headline: 'h4',
  body: 'p',
  supporting: 'p',
  label: 'span',
  caption: 'span',
};

export interface TextProps extends ComponentPropsWithoutRef<'p'> {
  readonly role?: TextRole;
  readonly tone?: TextTone;
  /** Changes the element, for the page's outline, without changing the look. */
  readonly as?: TextElement;
}

/** Words on a screen, in one of the type roles. */
export function Text({ role = 'body', tone = 'primary', as, className, children, ...rest }: TextProps) {
  return createElement(
    as ?? defaultElement[role],
    {
      ...rest,
      'data-role': role,
      'data-tone': tone,
      className: [styles.text, className].filter(Boolean).join(' '),
    },
    children,
  );
}
