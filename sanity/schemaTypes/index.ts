import type { SchemaTypeDefinition } from "sanity";
import { contactMessage, quoteRequest } from "./inbox";
import { project } from "./project";
import { rentalCategory, rentalItem } from "./rentals";
import { siteSettings } from "./siteSettings";
import { talent } from "./talent";

export const schemaTypes: SchemaTypeDefinition[] = [
  siteSettings,
  project,
  talent,
  rentalCategory,
  rentalItem,
  quoteRequest,
  contactMessage,
];
