import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const comparisons = pgTable("comparisons", {
  id: serial("id").primaryKey(),
  articleTitle: text("article_title").notNull(),
  selectedLanguages: jsonb("selected_languages").notNull(), // Array of language codes
  outputLanguage: text("output_language").notNull(),
  comparisonResult: text("comparison_result"),
  isFunnyMode: boolean("is_funny_mode").default(false),
  isPremium: boolean("is_premium").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const highlights = pgTable("highlights", {
  id: serial("id").primaryKey(),
  comparisonId: integer("comparison_id").notNull(),
  startOffset: integer("start_offset").notNull(),
  endOffset: integer("end_offset").notNull(),
  color: text("color").notNull(), // yellow, green, blue, pink, orange
  excerpt: text("excerpt").notNull(), // Snippet of highlighted text for validation
  createdAt: timestamp("created_at").defaultNow(),
});

export const searchSessions = pgTable("search_sessions", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull().unique(),
  searchQuery: text("search_query"),
  selectedArticle: jsonb("selected_article"),
  availableLanguages: jsonb("available_languages"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertComparisonSchema = createInsertSchema(comparisons).omit({
  id: true,
  createdAt: true,
});

export const insertSearchSessionSchema = createInsertSchema(searchSessions).omit({
  id: true,
  createdAt: true,
});

export const insertHighlightSchema = createInsertSchema(highlights).omit({
  id: true,
  createdAt: true,
});

export type InsertComparison = z.infer<typeof insertComparisonSchema>;
export type Comparison = typeof comparisons.$inferSelect;
export type InsertSearchSession = z.infer<typeof insertSearchSessionSchema>;
export type SearchSession = typeof searchSessions.$inferSelect;
export type InsertHighlight = z.infer<typeof insertHighlightSchema>;
export type Highlight = typeof highlights.$inferSelect;

// Wikipedia API response types
export const wikipediaSearchResultSchema = z.object({
  title: z.string(),
  snippet: z.string(),
  pageid: z.number(),
});

export const wikipediaLanguageLinkSchema = z.object({
  lang: z.string(),
  title: z.string(),
  url: z.string(),
});

export const wikipediaArticleSchema = z.object({
  pageid: z.number(),
  title: z.string(),
  content: z.string(),
  language: z.string(),
  contentLength: z.number(),
});

export type WikipediaSearchResult = z.infer<typeof wikipediaSearchResultSchema>;
export type WikipediaLanguageLink = z.infer<typeof wikipediaLanguageLinkSchema>;
export type WikipediaArticle = z.infer<typeof wikipediaArticleSchema>;
