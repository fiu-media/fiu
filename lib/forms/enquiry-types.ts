// No imports: the Studio's inbox schema lists these too, and its bundle can't take the form schemas' dependencies (zod, `@/` aliases).
export const ENQUIRY_TYPES = ["Project", "Talent", "Rentals", "Other"] as const;
export type EnquiryType = (typeof ENQUIRY_TYPES)[number];

export const isEnquiryType = (value: string | null): value is EnquiryType =>
  (ENQUIRY_TYPES as readonly string[]).includes(value ?? "");
