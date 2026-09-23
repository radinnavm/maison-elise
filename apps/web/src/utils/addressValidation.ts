export interface AddressFormValues {
  firstName: string;
  lastName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  postalCode: string;
  countryCode: string;
  isDefault: boolean;
}

export type AddressFormErrors = Partial<Record<keyof AddressFormValues, string>>;

export const emptyAddress: AddressFormValues = {
  firstName: '',
  lastName: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  postalCode: '',
  countryCode: '',
  isDefault: false,
};

export function validateAddress(values: AddressFormValues): AddressFormErrors {
  const errors: AddressFormErrors = {};

  if (!values.firstName.trim()) errors.firstName = 'First name is required.';
  if (!values.lastName.trim()) errors.lastName = 'Last name is required.';
  if (values.phone.trim().length < 4) errors.phone = 'Enter a valid phone number.';
  if (!values.addressLine1.trim()) errors.addressLine1 = 'Address is required.';
  if (!values.city.trim()) errors.city = 'City is required.';
  if (!values.postalCode.trim()) errors.postalCode = 'Postal code is required.';
  if (values.countryCode.trim().length !== 2) {
    errors.countryCode = 'Use a 2-letter country code.';
  }

  return errors;
}
