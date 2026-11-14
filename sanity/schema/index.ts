import type { SchemaTypeDefinition } from "sanity";

import { contactMessage, quoteRequest } from "../../content/inbox/schema";
import { launchGate } from "../../content/launchGate/schema";
import { project } from "../../content/project/schema";
import { rentalCategory, rentalItem } from "../../content/rentalItem/schema";
import { siteSettings } from "../../content/siteSettings/schema";
import { talent } from "../../content/talent/schema";
import { projectType, role } from "../../content/taxonomy/schema";

export const schemaTypes: SchemaTypeDefinition[] = [
  siteSettings,
  launchGate,
  project,
  talent,
  projectType,
  role,
  rentalCategory,
  rentalItem,
  quoteRequest,
  contactMessage,
];
