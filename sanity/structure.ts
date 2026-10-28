import { CogIcon } from "@sanity/icons/Cog";
import { ComposeIcon } from "@sanity/icons/Compose";
import { EnvelopeIcon } from "@sanity/icons/Envelope";
import { ThLargeIcon } from "@sanity/icons/ThLarge";
import { UsersIcon } from "@sanity/icons/Users";
import { VideoIcon } from "@sanity/icons/Video";
import { orderableDocumentListDeskItem } from "@sanity/orderable-document-list";
import type { ComponentType } from "react";
import type { StructureResolver } from "sanity/structure";
import { defaultLocale } from "../lib/i18n/config";

const singletons = ["siteSettings"];
const inboxTypes = ["quoteRequest", "contactMessage"];

/**
 * Drag-and-drop list of the default-language documents of `type`. Translations take their order
 * from these (see `byRank` in lib/queries.ts), so there is one list to reorder, not one per language.
 */
const orderableList = (
  S: Parameters<StructureResolver>[0],
  context: Parameters<StructureResolver>[1],
  type: string,
  title: string,
  icon?: ComponentType,
) =>
  orderableDocumentListDeskItem({
    type,
    title,
    icon,
    S,
    context,
    filter: "language == $lang",
    params: { lang: defaultLocale },
  });

export const structure: StructureResolver = (S, context) =>
  S.list()
    .title("Fiú Media")
    .items([
      S.listItem()
        .title("Settings")
        .icon(CogIcon)
        .child(S.document().schemaType("siteSettings").documentId("siteSettings")),
      S.divider(),
      S.listItem()
        .title("Projects")
        .icon(VideoIcon)
        .child(
          S.list()
            .title("Projects")
            .items([
              orderableList(S, context, "project", "Projects"),
              orderableList(S, context, "projectType", "Types"),
            ]),
        ),
      S.listItem()
        .title("Talent")
        .icon(UsersIcon)
        .child(
          S.list()
            .title("Talent")
            .items([
              orderableList(S, context, "talent", "Talent"),
              orderableList(S, context, "role", "Roles"),
            ]),
        ),
      S.listItem()
        .title("Rentals")
        .icon(ThLargeIcon)
        .child(
          S.list()
            .title("Rentals")
            .items([
              orderableList(S, context, "rentalItem", "Items"),
              orderableList(S, context, "rentalCategory", "Categories"),
            ]),
        ),
      S.divider(),
      S.listItem()
        .title("Inbox")
        .icon(EnvelopeIcon)
        .child(
          S.list()
            .title("Inbox")
            .items([
              S.documentTypeListItem("quoteRequest").title("Quote requests").icon(ComposeIcon),
              S.documentTypeListItem("contactMessage").title("Messages").icon(EnvelopeIcon),
            ]),
        ),
    ]);

/** Singletons and site-written documents shouldn't appear in "new document" menus. */
export const hiddenTemplates = [...singletons, ...inboxTypes];

/** Singletons can't be duplicated or deleted. */
export const singletonActions = (actions: { action?: string }[], schemaType: string) =>
  singletons.includes(schemaType)
    ? actions.filter(({ action }) => action && ["publish", "discardChanges", "restore"].includes(action))
    : actions;
