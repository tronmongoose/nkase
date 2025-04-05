import { pgTable, text, serial, integer, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull().default("incident_responder"),
  avatarUrl: text("avatar_url"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true,
  role: true,
  avatarUrl: true,
});

// Incident schema
export const incidents = pgTable("incidents", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  severity: text("severity").notNull(), // critical, high, medium, low
  status: text("status").notNull().default("active"), // active, resolved, false_positive
  detectedAt: timestamp("detected_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  affectedResources: text("affected_resources").array(), // Array of resource IDs
  assignedTo: integer("assigned_to").references(() => users.id),
  incidentId: text("incident_id").notNull(), // Business ID like INC-20230715-0053
});

export const insertIncidentSchema = createInsertSchema(incidents).pick({
  title: true,
  description: true,
  severity: true,
  status: true,
  detectedAt: true,
  affectedResources: true,
  assignedTo: true,
  incidentId: true,
});

// AWS Resource schema
export const resources = pgTable("resources", {
  id: serial("id").primaryKey(),
  resourceId: text("resource_id").notNull(), // AWS resource ID
  resourceType: text("resource_type").notNull(), // EC2, S3, IAM, Lambda, etc
  name: text("name").notNull(),
  region: text("region").notNull(),
  status: text("status").notNull().default("normal"), // normal, compromised, isolated, etc
  metadata: jsonb("metadata"), // Additional resource-specific details
  isolated: boolean("isolated").default(false),
  forensicCopy: boolean("forensic_copy").default(false),
  discoveredAt: timestamp("discovered_at").notNull().defaultNow(),
});

export const insertResourceSchema = createInsertSchema(resources).pick({
  resourceId: true,
  resourceType: true,
  name: true,
  region: true,
  status: true,
  metadata: true,
  isolated: true,
  forensicCopy: true,
  discoveredAt: true,
});

// Timeline events schema
export const timelineEvents = pgTable("timeline_events", {
  id: serial("id").primaryKey(),
  incidentId: integer("incident_id").references(() => incidents.id),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  eventType: text("event_type").notNull(), // initial_access, privilege_escalation, etc
  description: text("description").notNull(),
  severity: text("severity").notNull(), // critical, high, medium, low, info
});

export const insertTimelineEventSchema = createInsertSchema(timelineEvents).pick({
  incidentId: true,
  timestamp: true,
  eventType: true,
  description: true,
  severity: true,
});

// Types for the schemas
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Incident = typeof incidents.$inferSelect;
export type InsertIncident = z.infer<typeof insertIncidentSchema>;

export type Resource = typeof resources.$inferSelect;
export type InsertResource = z.infer<typeof insertResourceSchema>;

export type TimelineEvent = typeof timelineEvents.$inferSelect;
export type InsertTimelineEvent = z.infer<typeof insertTimelineEventSchema>;
