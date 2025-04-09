import { pgTable, text, serial, integer, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Type definitions
export type IncidentSeverity = "critical" | "high" | "medium" | "low";
export type CloudProvider = "aws" | "azure" | "gcp";
export type ComplianceAction = "notify" | "enforce";
export type ComplianceStatus = "compliant" | "non_compliant" | "exempted" | "not_applicable";

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
  updatedAt: true,
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

// Cloud Account schema
export const cloudAccounts = pgTable("cloud_accounts", {
  id: serial("id").primaryKey(),
  accountId: text("account_id").notNull(), // AWS account ID, Azure subscription ID, etc.
  provider: text("provider").notNull(), // aws, azure, gcp
  name: text("name").notNull(),
  status: text("status").notNull().default("active"), // active, suspended, etc.
  ownerEmail: text("owner_email"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastScannedAt: timestamp("last_scanned_at"),
  metadata: jsonb("metadata"), // Additional account-specific details
});

export const insertCloudAccountSchema = createInsertSchema(cloudAccounts).pick({
  accountId: true,
  provider: true,
  name: true,
  status: true,
  ownerEmail: true,
  createdAt: true,
  lastScannedAt: true,
  metadata: true,
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

// Compliance Standard schema
export const complianceStandards = pgTable("compliance_standards", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(), // NIST, PCI, HIPAA, etc.
  displayName: text("display_name").notNull(),
  description: text("description").notNull(),
  version: text("version").notNull(),
  category: text("category"), // Security, Privacy, Industry, etc.
  link: text("link"), // URL to the standard documentation
  enabled: boolean("enabled").default(true),
});

export const insertComplianceStandardSchema = createInsertSchema(complianceStandards).pick({
  name: true,
  displayName: true,
  description: true,
  version: true,
  category: true,
  link: true,
  enabled: true,
});

// Compliance Rule schema
export const complianceRules = pgTable("compliance_rules", {
  id: serial("id").primaryKey(),
  standardId: integer("standard_id").references(() => complianceStandards.id).notNull(),
  ruleId: text("rule_id").notNull(), // e.g., NIST-AC-1, PCI-DSS-1.2
  title: text("title").notNull(),
  description: text("description").notNull(),
  severity: text("severity").notNull(), // critical, high, medium, low
  resourceTypes: text("resource_types").array(), // Types of resources this rule applies to
  action: text("action").notNull().default("notify"), // notify or enforce
  remediationSteps: text("remediation_steps"),
  enabled: boolean("enabled").default(true),
  providers: text("providers").array(), // aws, azure, gcp
});

export const insertComplianceRuleSchema = createInsertSchema(complianceRules).pick({
  standardId: true,
  ruleId: true,
  title: true,
  description: true,
  severity: true,
  resourceTypes: true,
  action: true,
  remediationSteps: true,
  enabled: true,
  providers: true,
});

// Resource Compliance Status schema
export const resourceCompliance = pgTable("resource_compliance", {
  id: serial("id").primaryKey(),
  resourceId: integer("resource_id").references(() => resources.id).notNull(),
  ruleId: integer("rule_id").references(() => complianceRules.id).notNull(),
  status: text("status").notNull().default("non_compliant"), // compliant, non_compliant, exempted, not_applicable
  lastChecked: timestamp("last_checked").notNull().defaultNow(),
  details: jsonb("details"), // Details about the compliance check
  exemptionReason: text("exemption_reason"),
  exemptionExpiry: timestamp("exemption_expiry"),
  exemptedBy: integer("exempted_by").references(() => users.id),
  exemptedAt: timestamp("exempted_at"),
});

export const insertResourceComplianceSchema = createInsertSchema(resourceCompliance).pick({
  resourceId: true,
  ruleId: true,
  status: true,
  lastChecked: true,
  details: true,
  exemptionReason: true,
  exemptionExpiry: true,
  exemptedBy: true,
  exemptedAt: true,
});

// Account Compliance schema (aggregate compliance status for an account)
export const accountCompliance = pgTable("account_compliance", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").references(() => cloudAccounts.id).notNull(),
  standardId: integer("standard_id").references(() => complianceStandards.id).notNull(),
  compliantRules: integer("compliant_rules").notNull().default(0),
  nonCompliantRules: integer("non_compliant_rules").notNull().default(0),
  exemptedRules: integer("exempted_rules").notNull().default(0),
  notApplicableRules: integer("not_applicable_rules").notNull().default(0),
  lastScanned: timestamp("last_scanned").notNull().defaultNow(),
  overallStatus: text("overall_status").notNull().default("non_compliant"), // compliant, non_compliant
});

export const insertAccountComplianceSchema = createInsertSchema(accountCompliance).pick({
  accountId: true,
  standardId: true,
  compliantRules: true,
  nonCompliantRules: true,
  exemptedRules: true,
  notApplicableRules: true,
  lastScanned: true,
  overallStatus: true,
});

export type CloudAccount = typeof cloudAccounts.$inferSelect;
export type InsertCloudAccount = z.infer<typeof insertCloudAccountSchema>;

export type ComplianceStandard = typeof complianceStandards.$inferSelect;
export type InsertComplianceStandard = z.infer<typeof insertComplianceStandardSchema>;

export type ComplianceRule = typeof complianceRules.$inferSelect;
export type InsertComplianceRule = z.infer<typeof insertComplianceRuleSchema>;

export type ResourceCompliance = typeof resourceCompliance.$inferSelect;
export type InsertResourceCompliance = z.infer<typeof insertResourceComplianceSchema>;

export type AccountCompliance = typeof accountCompliance.$inferSelect;
export type InsertAccountCompliance = z.infer<typeof insertAccountComplianceSchema>;
