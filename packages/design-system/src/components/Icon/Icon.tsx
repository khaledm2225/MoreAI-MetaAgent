import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Image,
  Info,
  Languages,
  Minus,
  Package,
  Plus,
  Search,
  Send,
  ShoppingBag,
  Sparkles,
  Star,
  Store,
  Trash2,
  User,
  X,
} from 'lucide-react';

const icons = {
  activity: Activity,
  alert: CircleAlert,
  arrowBack: ArrowLeft,
  arrowForward: ArrowRight,
  bag: ShoppingBag,
  camera: Camera,
  check: Check,
  chevronBack: ChevronLeft,
  chevronForward: ChevronRight,
  close: X,
  image: Image,
  info: Info,
  languages: Languages,
  minus: Minus,
  package: Package,
  plus: Plus,
  search: Search,
  send: Send,
  sparkles: Sparkles,
  star: Star,
  store: Store,
  trash: Trash2,
  user: User,
} as const;

export type IconName = keyof typeof icons;

const mirroredIcons: ReadonlySet<IconName> = new Set([
  'arrowBack',
  'arrowForward',
  'chevronBack',
  'chevronForward',
  'send',
]);

export interface IconProps {
  readonly name: IconName;
  /** A number means pixels. By default it follows the size of the words next to it. */
  readonly size?: number | string;
  readonly className?: string | undefined;
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
