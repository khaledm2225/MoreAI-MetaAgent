import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  Languages,
  Search,
  Send,
  ShoppingBag,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';

const icons = {
  arrowBack: ArrowLeft,
  arrowForward: ArrowRight,
  bag: ShoppingBag,
  camera: Camera,
  check: Check,
  close: X,
  languages: Languages,
  search: Search,
  send: Send,
  sparkles: Sparkles,
  trash: Trash2,
} as const;

export type IconName = keyof typeof icons;

const mirroredIcons: ReadonlySet<IconName> = new Set(['arrowBack', 'arrowForward']);

export interface IconProps {
  readonly name: IconName;
  /** A number means pixels. By default it follows the size of the words next to it. */
  readonly size?: number | string;
  readonly className?: string;
}

/** The app's icons. Always decoration next to words, so screen readers skip them. */
export function Icon({ name, size = '1.25em', className }: IconProps) {
  const Glyph = icons[name];
  return (
    <Glyph
      size={size}
      aria-hidden="true"
      data-icon={name}
      {...(mirroredIcons.has(name) ? { 'data-mirrored': 'true' } : {})}
      {...(className === undefined ? {} : { className })}
    />
  );
}
