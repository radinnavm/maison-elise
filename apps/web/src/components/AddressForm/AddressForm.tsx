import { useState } from 'react';
import type { FormEvent } from 'react';

import type { AddressDto } from '@maison-elise/shared';

import { getErrorMessage } from '@/api/apiError';
import { useCreateAddressMutation } from '@/api/addressApi';
import { Button } from '@/components/Button/Button';
import { FormField } from '@/components/FormField/FormField';
import {
  emptyAddress,
  validateAddress,
  type AddressFormErrors,
  type AddressFormValues,
} from '@/utils/addressValidation';

import styles from './AddressForm.module.css';

interface AddressFormProps {
  onCreated: (address: AddressDto) => void;
  onCancel?: () => void;
}

export function AddressForm({ onCreated, onCancel }: AddressFormProps) {
  const [createAddress, { isLoading }] = useCreateAddressMutation();
  const [values, setValues] = useState<AddressFormValues>(emptyAddress);
  const [errors, setErrors] = useState<AddressFormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  function update<K extends keyof AddressFormValues>(key: K, value: AddressFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const validation = validateAddress(values);
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }

    try {
      const result = await createAddress({
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        phone: values.phone.trim(),
        addressLine1: values.addressLine1.trim(),
        ...(values.addressLine2.trim() ? { addressLine2: values.addressLine2.trim() } : {}),
        city: values.city.trim(),
        postalCode: values.postalCode.trim(),
        countryCode: values.countryCode.trim().toUpperCase(),
        isDefault: values.isDefault,
      }).unwrap();

      onCreated(result.data);
    } catch (submitError) {
      setFormError(getErrorMessage(submitError));
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      {formError ? (
        <p className={styles.formError} role="alert">
          {formError}
        </p>
      ) : null}

      <div className={styles.grid}>
        <FormField
          label="First name"
          name="firstName"
          value={values.firstName}
          onChange={(e) => update('firstName', e.target.value)}
          error={errors.firstName}
          autoComplete="given-name"
        />
        <FormField
          label="Last name"
          name="lastName"
          value={values.lastName}
          onChange={(e) => update('lastName', e.target.value)}
          error={errors.lastName}
          autoComplete="family-name"
        />
        <FormField
          label="Phone"
          name="phone"
          value={values.phone}
          onChange={(e) => update('phone', e.target.value)}
          error={errors.phone}
          autoComplete="tel"
        />
        <FormField
          label="Country code"
          name="countryCode"
          value={values.countryCode}
          onChange={(e) => update('countryCode', e.target.value)}
          error={errors.countryCode}
          placeholder="FR"
          autoComplete="country"
        />
        <FormField
          label="Address"
          name="addressLine1"
          value={values.addressLine1}
          onChange={(e) => update('addressLine1', e.target.value)}
          error={errors.addressLine1}
          autoComplete="address-line1"
        />
        <FormField
          label="Address line 2 (optional)"
          name="addressLine2"
          value={values.addressLine2}
          onChange={(e) => update('addressLine2', e.target.value)}
          autoComplete="address-line2"
        />
        <FormField
          label="City"
          name="city"
          value={values.city}
          onChange={(e) => update('city', e.target.value)}
          error={errors.city}
          autoComplete="address-level2"
        />
        <FormField
          label="Postal code"
          name="postalCode"
          value={values.postalCode}
          onChange={(e) => update('postalCode', e.target.value)}
          error={errors.postalCode}
          autoComplete="postal-code"
        />
      </div>

      <label className={styles.checkbox}>
        <input
          type="checkbox"
          checked={values.isDefault}
          onChange={(e) => update('isDefault', e.target.checked)}
        />
        Set as my default address
      </label>

      <div className={styles.actions}>
        <Button type="submit" variant="primary" size="md" disabled={isLoading}>
          {isLoading ? 'Saving…' : 'Save address'}
        </Button>
        {onCancel ? (
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  );
}
