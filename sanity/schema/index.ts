import type { SchemaTypeDefinition } from "sanity";

import { contactMessage, quoteRequest } from "../../content/inbox/schema";
import { project } from "../../content/project/schema";
import { rentalCategory, rentalItem } from "../../content/rentalItem/schema";
import { siteSettings } from "../../content/siteSettings/schema";
import { talent } from "../../content/talent/schema";
import { projectType, role } from "../../content/taxonomy/schema";

export const schemaTypes: SchemaTypeDefinition[] = [
  siteSettings,
  project,
  talent,
  projectType,
  role,
  rentalCategory,
  rentalItem,
  quoteRequest,
  contactMessage,
];
