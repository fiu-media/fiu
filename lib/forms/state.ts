/** Error codes the server returns; the client maps them to localised copy (`dict.forms.errors`). */
export type FormErrorCode =
  "required" | "invalid" | "empty" | "beforeStart" | "past" | "overLimit" | "unavailable" | "rejected" | "failed";

export type FormState = {
  status: "idle" | "success" | "error";
  /** Per-field error codes, keyed by input name. */
  fieldErrors?: Partial<Record<string, FormErrorCode>>;
  /** Form-level error that isn't tied to one field. */
  error?: FormErrorCode;
  /** Submitted text values, so the form can repopulate after React resets it. */
  values?: Record<string, string>;
};

export const initialFormState: FormState = { status: "idle" };

const codes: readonly string[] = [
  "required",
  "invalid",
  "empty",
  "beforeStart",
  "past",
  "overLimit",
  "unavailable",
  "rejected",
  "failed",
] satisfies FormErrorCode[];

export const toErrorCode = (message: string): FormErrorCode => (codes.includes(message) ? (message as FormErrorCode) : "invalid");
