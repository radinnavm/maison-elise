import { describe, expect, it } from 'vitest';

import { emptyAddress, validateAddress } from '@/utils/addressValidation';

describe('validateAddress', () => {
  const valid = {
    firstName: 'Camille',
    lastName: 'Laurent',
    phone: '+33123456789',
    addressLine1: '12 Rue Saint-Honoré',
    addressLine2: '',
    city: 'Paris',
    postalCode: '75001',
    countryCode: 'FR',
    isDefault: false,
  };

  it('accepts a complete address', () => {
    expect(validateAddress(valid)).toEqual({});
  });

  it('requires the mandatory fields', () => {
    const errors = validateAddress(emptyAddress);

    expect(errors.firstName).toBeDefined();
    expect(errors.lastName).toBeDefined();
    expect(errors.addressLine1).toBeDefined();
    expect(errors.city).toBeDefined();
    expect(errors.postalCode).toBeDefined();
    expect(errors.countryCode).toBeDefined();
  });

  it('requires a two-letter country code', () => {
    expect(validateAddress({ ...valid, countryCode: 'France' }).countryCode).toBeDefined();
  });

  it('rejects a too-short phone number', () => {
    expect(validateAddress({ ...valid, phone: '12' }).phone).toBeDefined();
  });
});
