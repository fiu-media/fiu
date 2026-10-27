import { CogIcon } from "@sanity/icons/Cog";
import { ComposeIcon } from "@sanity/icons/Compose";
import { EnvelopeIcon } from "@sanity/icons/Envelope";
import { ThLargeIcon } from "@sanity/icons/ThLarge";
import { UsersIcon } from "@sanity/icons/Users";
import { VideoIcon } from "@sanity/icons/Video";
import type { StructureResolver } from "sanity/structure";

const singletons = ["siteSettings"];
const inboxTypes = ["quoteRequest", "contactMessage"];

export const structure: StructureResolver = (S) =>
  S.list()
    .title("Fiú Media")
    .items([
      S.listItem()
        .title("Settings")
        .icon(CogIcon)
        .child(S.document().schemaType("siteSettings").documentId("siteSettings")),
      S.divider(),
      S.documentTypeListItem("project").title("Projects").icon(VideoIcon),
      S.documentTypeListItem("talent").title("Talent").icon(UsersIcon),
      S.listItem()
        .title("Rentals")
        .icon(ThLargeIcon)
        .child(
          S.list()
            .title("Rentals")
            .items([
              S.documentTypeListItem("rentalItem").title("Items"),
              S.documentTypeListItem("rentalCategory").title("Categories"),
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
