export interface SavedAddress {
  id: string;
  label: string; // e.g. "Casa", "Oficina"
  fullName: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}
