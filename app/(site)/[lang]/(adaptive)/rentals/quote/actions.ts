"use server";

import { getRecipient } from "@/lib/email/settings";
import { studioEditUrl } from "@/lib/email/studio-link";
import { quoteConfirmation, quoteNotification, type KitLine } from "@/lib/email/templates";
import { isConflict, sendAll } from "@/lib/forms/notify";
import { quoteSchema } from "@/lib/forms/schemas";
import { formSuccess, type FormState } from "@/lib/forms/state";
import { guardSubmission } from "@/lib/forms/submit";
import { defaultLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { AVAILABLE_ITEM_IDS_QUERY } from "@/sanity/lib/queries";
import { writeClient } from "@/sanity/lib/writeClient";

const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Dublin" }).format(new Date());

export async function submitQuote(_previous: FormState, formData: FormData): Promise<FormState> {
  const guarded = await guardSubmission(quoteSchema, formData);
  if (!guarded.ok) return guarded.result;
  const { data, reply } = guarded;

  if (data.startDate < today()) return reply({ fieldErrors: { startDate: ["past"] } });

  // The basket lives in the visitor's browser, so treat it as untrusted: merge duplicates and
  // only accept items that are currently published and available.
  const qtyById = new Map<string, number>();
  for (const { itemId, qty } of data.items) qtyById.set(itemId, Math.min(99, (qtyById.get(itemId) ?? 0) + qty));
  const found = await writeClient.fetch(AVAILABLE_ITEM_IDS_QUERY, {
    ids: [...qtyById.keys()],
    fallbackLang: defaultLocale,
  });
  if (found.length !== qtyById.size) return reply({ formErrors: ["unavailable"] });

  if (found.some((item) => qtyById.get(item._id)! > (item.maxQuantity ?? 99))) {
    return reply({ formErrors: ["overLimit"] });
  }

  const kit: KitLine[] = found.map((item) => ({ name: item.name, brand: item.brand, qty: qtyById.get(item._id)! }));
  const id = `quoteRequest-${data.submissionId}`;

  try {
    // `create` (not createOrReplace) so a retried or double-submitted form can't reset the
    // status an editor has already moved on, and doesn't send the emails twice.
    await writeClient.create({
      _id: id,
      _type: "quoteRequest",
      status: "new",
      name: data.name,
      email: data.email,
      phone: data.phone || undefined,
      company: data.company || undefined,
      production: data.production || undefined,
      startDate: data.startDate,
      endDate: data.endDate,
      message: data.message || undefined,
      items: found.map((item) => ({
        _key: item._id.replace(/[^a-zA-Z0-9]/g, "").slice(-12) || item._id,
        _type: "line",
        item: { _type: "reference", _ref: item._id },
        qty: qtyById.get(item._id),
      })),
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    if (isConflict(error)) return formSuccess;
    console.error("[quote] could not store quote request:", error);
    return reply({ formErrors: ["failed"] });
  }

  const dict = await getDictionary(data.lang);
  const emailData = { ...data, kit };
  const to = await getRecipient("quote", data.lang);
  if (!to) console.warn("[quote] no recipient configured (Site settings or QUOTE_TO_EMAIL); skipping notification");
  const notification = quoteNotification(dict, emailData, studioEditUrl(id, "quoteRequest"));
  await sendAll([
    to ? { to, replyTo: data.email, ...notification } : null,
    { to: data.email, ...quoteConfirmation(dict, emailData) },
  ]);

  return formSuccess;
}
