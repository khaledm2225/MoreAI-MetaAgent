import { Button, Stack, Text, TextField } from '@metaagent/design-system';
import { useTranslations } from '@metaagent/i18n';
import { useState, type FormEvent } from 'react';
import { addressProblems, type Address, type AddressField } from '../domain/order';
import { strings } from './strings';

const EMPTY_ADDRESS: Address = {
  recipientName: '',
  mobile: '',
  area: '',
  street: '',
  building: '',
  floor: '',
  apartment: '',
  landmark: '',
  notes: '',
};

export interface AddressFormProps {
  readonly submitLabel: string;
  readonly isSubmitting?: boolean;
  readonly onSubmit: (address: Address) => void;
}

/** The delivery address. It shows what's missing, and only submits a complete address. */
export function AddressForm({ submitLabel, isSubmitting = false, onSubmit }: AddressFormProps) {
  const t = useTranslations(strings);
  const [address, setAddress] = useState(EMPTY_ADDRESS);
  const [problems, setProblems] = useState<readonly AddressField[]>([]);

  function submit(event: FormEvent) {
    event.preventDefault();
    const found = addressProblems(address);
    setProblems(found);
    if (found.length === 0) {
      onSubmit(address);
    }
  }

  function field(name: keyof Address, label: string, type = 'text') {
    const isRequired = (['recipientName', 'mobile', 'area', 'street', 'building'] as const).some((item) => item === name);
    const hasProblem = isRequired && problems.includes(name as AddressField);
    const message = name === 'mobile' ? t('addressMobileError') : t('addressRequired');
    return (
      <TextField
        label={label}
        type={type}
        name={name}
        value={address[name]}
        required={isRequired}
        onChange={(event) => setAddress({ ...address, [name]: event.target.value })}
        {...(hasProblem ? { error: message } : {})}
      />
    );
  }

  return (
    <form noValidate onSubmit={submit}>
      <Stack gap="s">
        <Text role="headline" as="h3">
          {t('addressTitle')}
        </Text>
        {field('recipientName', t('addressName'))}
        {field('mobile', t('addressMobile'), 'tel')}
        {field('area', t('addressArea'))}
        {field('street', t('addressStreet'))}
        {field('building', t('addressBuilding'))}
        {field('floor', t('addressFloor'))}
        {field('apartment', t('addressApartment'))}
        {field('landmark', t('addressLandmark'))}
        <Button type="submit" isLoading={isSubmitting}>
          {submitLabel}
        </Button>
      </Stack>
    </form>
  );
}
