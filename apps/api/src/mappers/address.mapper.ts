import type { AddressDto } from '@maison-elise/shared';

import type { AddressRecord } from '../repositories/address.repository.js';

export function toAddressDto(address: AddressRecord): AddressDto {
  return {
    id: address.id,
    firstName: address.firstName,
    lastName: address.lastName,
    phone: address.phone,
    addressLine1: address.addressLine1,
    addressLine2: address.addressLine2 ?? undefined,
    city: address.city,
    postalCode: address.postalCode,
    countryCode: address.countryCode,
    isDefault: address.isDefault,
    createdAt: address.createdAt.toISOString(),
  };
}
