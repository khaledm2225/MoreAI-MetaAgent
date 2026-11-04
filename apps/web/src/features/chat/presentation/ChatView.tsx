import { Badge, Banner, Bubble, Button, ButtonStack, Card, Chip, Confetti, Container, EmptyState, Icon, IconButton, Spinner, Stack, Text, TextField } from '@metaagent/design-system';
import { useLocale, useTranslations } from '@metaagent/i18n';
import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import type { SuggestedPiece } from '../../../core/domain/agent';
import type { Id } from '../../../core/domain/catalog';
import type { Address } from '../../../core/domain/order';
import { isBuyable } from '../../../core/domain/search';
import { photoProblem, PHOTO_TYPES, type PhotoInput } from '../../../core/domain/vision';
import { AddressForm } from '../../../core/presentation/AddressForm';
import { ProductCard } from '../../../core/presentation/ProductCard';
import { strings as sharedStrings } from '../../../core/presentation/strings';
import type { ChatItem, ChatState } from './chatState';
import styles from './ChatScreen.module.css';
import { strings } from './strings';
import { TracePanel } from './TracePanel';

export interface ChatViewProps {
  readonly state: ChatState;
  /** Labels for a variant's size, since the view holds no catalog. */
  readonly sizeLabelOf: (sizeId: Id) => string;
  readonly onSend: (text: string, photo?: PhotoInput) => void;
  /** Makes a picked photo showable on the page. */
  readonly createPhotoUrl: (file: File) => string;
  readonly onChooseVariant: (productId: Id, variantId: Id) => void;
  readonly onAnswer: (requestId: Id, accepted: boolean) => void;
  readonly onGiveAddress: (address: Address) => void;
  readonly onOpenProduct: (productId: Id) => void;
  readonly onOpenOrders: () => void;
  readonly onOpenPhotoToShop: () => void;
}

function Piece({
  piece,
  sizeLabelOf,
  onChooseVariant,
  onOpenProduct,
}: {
  readonly piece: SuggestedPiece;
} & Pick<ChatViewProps, 'sizeLabelOf' | 'onChooseVariant' | 'onOpenProduct'>) {
  const t = useTranslations(strings);
  const { locale } = useLocale();
  const [chosen, setChosen] = useState<Id | null>(null);
  return (
    <ProductCard
      compact
      product={piece.product}
      merchant={piece.merchant}
      reason={piece.reason[locale]}
      onOpen={() => onOpenProduct(piece.product.id)}
    >
      <Stack gap="xxs">
        <Text role="label" as="p">
          {t('chooseSize')}
        </Text>
        <Stack direction="row" gap="xxs">
          {piece.product.variants.map((variant) => (
            <Chip
              key={variant.id}
              selected={chosen === variant.id}
              disabled={!isBuyable(variant) || chosen !== null}
              onClick={() => {
                setChosen(variant.id);
                onChooseVariant(piece.product.id, variant.id);
              }}
            >
              {sizeLabelOf(variant.sizeId)}
            </Chip>
          ))}
        </Stack>
      </Stack>
    </ProductCard>
  );
}

function Item({ item, ...props }: { readonly item: ChatItem } & ChatViewProps) {
  const t = useTranslations(strings);
  const { locale, format } = useLocale();
  switch (item.kind) {
    case 'shopper':
      return (
        <Bubble from="self">
          {item.photoUrl !== undefined && <img className={styles.sentPhoto} src={item.photoUrl} alt={t('yourPhoto')} />}
          {item.text}
        </Bubble>
      );
    case 'assistant':
      return <Bubble from="other">{item.text[locale]}</Bubble>;
    case 'learned':
      return (
        <div className={styles.learned}>
          <Icon name="sparkles" />
          <Text role="supporting" tone="secondary" as="span">
            {`${t('learned')}: ${item.text[locale]}`}
          </Text>
        </div>
      );
    case 'suggestions':
      return (
        <div className={styles.pieces}>
          {item.pieces.map((piece) => (
            <Piece
              key={piece.product.id}
              piece={piece}
              sizeLabelOf={props.sizeLabelOf}
              onChooseVariant={props.onChooseVariant}
              onOpenProduct={props.onOpenProduct}
            />
          ))}
        </div>
      );
    case 'confirm':
      return (
        <Card>
          <Text role="headline" as="p">
            {item.request.question[locale]}
          </Text>
          {item.request.kind === 'placeOrder' && (
            <Text role="section" tone="accent" as="p">
              {t('total', { total: format.money(item.request.totalPiasters) })}
            </Text>
          )}
          {item.answer === null ? (
            <ButtonStack>
              <Button prominence="secondary" onClick={() => props.onAnswer(item.request.id, false)}>
                {t('no')}
              </Button>
              <Button icon="check" onClick={() => props.onAnswer(item.request.id, true)}>
                {t('yes')}
              </Button>
            </ButtonStack>
          ) : (
            <Badge>{item.answer ? t('confirmed') : t('declined')}</Badge>
          )}
        </Card>
      );
    case 'address':
      return (
        <Stack gap="s">
          <Bubble from="other">{item.text[locale]}</Bubble>
          {item.isOpen && (
            <Card>
              <AddressForm submitLabel={t('continue')} onSubmit={props.onGiveAddress} />
            </Card>
          )}
        </Stack>
      );
    case 'placed':
      return (
        <Card>
          <Confetti />
          <Text role="title" as="h2">
            {t('placedTitle')}
          </Text>
          <Text>{t('placedBody', { count: item.orders.length })}</Text>
          <Stack gap="xs">
            {item.orders.map((order) => (
              <Stack key={order.id} direction="row" gap="xs">
                <Badge>{order.merchantName}</Badge>
                <Text role="supporting" as="span">
                  {format.money(order.totalPiasters)}
                </Text>
              </Stack>
            ))}
          </Stack>
          <Button onClick={props.onOpenOrders}>{t('seeOrders')}</Button>
        </Card>
      );
    case 'limit':
      return <Banner tone="error">{item.text[locale]}</Banner>;
  }
}

/** The agent's conversation, from the first message to the placed order, with its live trace. */
export function ChatView(props: ChatViewProps) {
  const { state, onSend, onOpenPhotoToShop, createPhotoUrl } = props;
  const t = useTranslations(strings);
  const shared = useTranslations(sharedStrings);
  const [draft, setDraft] = useState('');
  const [photo, setPhoto] = useState<PhotoInput | null>(null);
  const [hasWrongPhoto, setHasWrongPhoto] = useState(false);
  const picker = useRef<HTMLInputElement>(null);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (photo !== null) {
      onSend(draft.trim() === '' ? t('photoDefaultText') : draft, photo);
    } else if (draft.trim() !== '') {
      onSend(draft);
    } else {
      return;
    }
    setDraft('');
    setPhoto(null);
  }

  function pickPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file === undefined) {
      return;
    }
    const isWrong = photoProblem({ type: file.type, sizeBytes: file.size }) !== null;
    setHasWrongPhoto(isWrong);
    if (!isWrong) {
      setPhoto({ name: file.name, type: file.type, sizeBytes: file.size, previewUrl: createPhotoUrl(file) });
    }
  }

  const examples = [t('exampleJacket'), t('exampleHoodie'), t('exampleWinter')];

  return (
    <Container width="wide" className={styles.page}>
      <div className={styles.layout}>
        <TracePanel steps={state.trace} />
        <section className={styles.conversation} aria-label={t('title')}>
          <Stack gap="xxs">
            <Stack direction="row" gap="xs">
              <Text role="title" as="h1">
                {t('title')}
              </Text>
              <Badge>{shared('demoNotice')}</Badge>
            </Stack>
            <Text role="supporting" tone="secondary">
              {t('subtitle')}
            </Text>
          </Stack>

          {state.items.length === 0 && (
            <>
              <EmptyState icon="sparkles" title={t('emptyTitle')} body={t('emptyBody')} />
              <Stack direction="row" gap="xs" role="group" aria-label={t('examplesLabel')}>
                {examples.map((example) => (
                  <Chip key={example} selected={false} onClick={() => onSend(example)}>
                    {example}
                  </Chip>
                ))}
              </Stack>
              <Button size="compact" prominence="quiet" icon="search" onClick={onOpenPhotoToShop}>
                {t('photoToShop')}
              </Button>
            </>
          )}

          <div className={styles.messages} role="log" aria-live="polite">
            {state.items.map((item) => (
              <div key={`${item.kind}-${item.id}`} className={styles.pop}>
                <Item item={item} {...props} />
              </div>
            ))}
            {state.isThinking && <Spinner label={t('thinking')} />}
            {state.hasFailed && <Banner tone="error">{t('error')}</Banner>}
          </div>

          {hasWrongPhoto && <Banner tone="error">{t('wrongPhoto')}</Banner>}
          {photo !== null && (
            <div className={styles.attached}>
              <img className={styles.attachedPhoto} src={photo.previewUrl} alt={t('yourPhoto')} />
              <IconButton icon="close" prominence="quiet" label={t('removePhoto')} onClick={() => setPhoto(null)} />
            </div>
          )}
          <form className={styles.composer} onSubmit={submit}>
            <TextField
              className={styles.composerField}
              label={t('messageLabel')}
              placeholder={photo === null ? t('messagePlaceholder') : t('photoPlaceholder')}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
            />
            <IconButton type="submit" icon="send" label={t('send')} prominence="primary" disabled={draft.trim() === '' && photo === null} />
            <IconButton icon="camera" label={t('addPhoto')} onClick={() => picker.current?.click()} />
            <input ref={picker} className={styles.picker} type="file" accept={PHOTO_TYPES.join(',')} aria-hidden="true" tabIndex={-1} onChange={pickPhoto} />
          </form>
        </section>
      </div>
    </Container>
  );
}
