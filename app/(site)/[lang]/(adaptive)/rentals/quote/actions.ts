"use server";

import { AVAILABLE_ITEM_IDS_QUERY } from "@/content/rentalItem";
import { MAX_QTY } from "@/features/rentals/basket/quantity";
import { build, type KitLine } from "@/lib/email/templates";
import { quoteSchema } from "@/lib/forms/schemas";
import type { FormState } from "@/lib/forms/state";
import { handleSubmission } from "@/lib/forms/submit";
import { defaultLocale } from "@/lib/i18n/config";
import { writeClient } from "@/sanity/lib/writeClient";

const availableItems = (ids: string[]) => writeClient.fetch(AVAILABLE_ITEM_IDS_QUERY, { ids, fallbackLang: defaultLocale });

type Found = Awaited<ReturnType<typeof availableItems>>[number];

/** The kit the visitor asked for, checked against what is published: the lines to store and to email. */
type Basket = { found: Found[]; qtyById: Map<string, number>; kit: KitLine[] };

export async function submitQuote(_previous: FormState, formData: FormData): Promise<FormState> {
  return handleSubmission<typeof quoteSchema, Basket>(
    {
      schema: quoteSchema,
      docType: "quoteRequest",
      recipient: "quote",
      validate: async (data) => {
        // The basket lives in the visitor's browser, so treat it as untrusted: merge duplicates and
        // only accept items that are currently published and available.
        const qtyById = new Map<string, number>();
        for (const { itemId, qty } of data.items) qtyById.set(itemId, Math.min(MAX_QTY, (qtyById.get(itemId) ?? 0) + qty));
        const found = await availableItems([...qtyById.keys()]);
        if (found.length !== qtyById.size) return { formErrors: ["unavailable"] };
        if (found.some((item) => qtyById.get(item._id)! > (item.maxQuantity ?? MAX_QTY))) return { formErrors: ["overLimit"] };

        const kit = found.map((item) => ({ name: item.name, brand: item.brand, qty: qtyById.get(item._id)! }));
        return { extra: { found, qtyById, kit } };
      },
      toDocument: (data, { found, qtyById }) => ({
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
      }),
      emails: ({ data, extra, dict, teamDict, studioLink }) => {
        const emailData = { ...data, kit: extra.kit };
        return {
          notification: build("quoteNotification", teamDict, emailData, { studioLink }),
          confirmation: build("quoteConfirmation", dict, emailData, { lang: data.lang }),
        };
      },
    },
    formData,
  );
}
