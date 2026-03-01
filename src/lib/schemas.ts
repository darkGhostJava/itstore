import { z } from "zod";

/**
 * @fileOverview Centralized Zod schemas for the application's core entities.
 * These schemas provide strict type safety for forms and API responses.
 */

export const ArticleSchema = z.object({
  id: z.number(),
  model: z.string(),
  designation: z.string(),
  type: z.enum(["HARDWARE", "CONSUMABLE"]),
  category: z.string(),
  quantity: z.number(),
  budget: z.string().optional().nullable(),
  strategicStock: z.number().optional().nullable(),
});

export const ItemSchema = z.object({
  id: z.number(),
  serialNumber: z.string().optional().nullable(),
  article: ArticleSchema,
  status: z.enum(["IN_STOCK_NEW", "IN_STOCK", "DISTRIBUTED", "UNDER_REPAIR", "REFORMED", "REPAIRED"]),
  budget: z.string().optional().nullable(),
  date: z.string().optional().nullable(),
});

export const PersonSchema = z.object({
  id: z.number(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  grade: z.string().optional(),
  matricule: z.string().optional(),
  pseudo: z.string().optional(),
  function: z.string(),
  structureId: z.number().optional().nullable(),
});
