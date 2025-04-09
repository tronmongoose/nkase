import { 
  users, type User, type InsertUser,
  incidents, type Incident, type InsertIncident,
  resources, type Resource, type InsertResource,
  timelineEvents, type TimelineEvent, type InsertTimelineEvent,
  resourceLogs, type ResourceLog, type InsertResourceLog,
  cloudAccounts, type CloudAccount, type InsertCloudAccount,
  complianceStandards, type ComplianceStandard, type InsertComplianceStandard,
  complianceRules, type ComplianceRule, type InsertComplianceRule,
  resourceCompliance, type ResourceCompliance, type InsertResourceCompliance,
  accountCompliance, type AccountCompliance, type InsertAccountCompliance
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, gt, lt, like, or } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Incident operations
  getIncident(id: number): Promise<Incident | undefined>;
  getIncidentById(incidentId: string): Promise<Incident | undefined>;
  getIncidents(filters?: {
    severity?: string;
    status?: string;
    timeframe?: string;
  }): Promise<Incident[]>;
  createIncident(incident: InsertIncident): Promise<Incident>;
  updateIncident(id: number, incident: Partial<InsertIncident>): Promise<Incident | undefined>;
  
  // Resource operations
  getResource(id: number): Promise<Resource | undefined>;
  getResourceById(resourceId: string): Promise<Resource | undefined>;
  getResources(filters?: {
    resourceType?: string;
    region?: string;
    status?: string;
  }): Promise<Resource[]>;
  createResource(resource: InsertResource): Promise<Resource>;
  updateResource(id: number, resource: Partial<InsertResource>): Promise<Resource | undefined>;
  
  // Timeline operations
  getTimelineEvents(incidentId: number): Promise<TimelineEvent[]>;
  createTimelineEvent(event: InsertTimelineEvent): Promise<TimelineEvent>;
  
  // Resource Log operations
  getResourceLogs(resourceId: number, filters?: {
    startDate?: Date;
    endDate?: Date;
    actionType?: string;
    region?: string;
  }): Promise<ResourceLog[]>;
  createResourceLog(log: InsertResourceLog): Promise<ResourceLog>;
  
  // Cloud Account operations
  getCloudAccount(id: number): Promise<CloudAccount | undefined>;
  getCloudAccountById(accountId: string): Promise<CloudAccount | undefined>;
  getCloudAccounts(filters?: {
    provider?: string;
    status?: string;
  }): Promise<CloudAccount[]>;
  createCloudAccount(account: InsertCloudAccount): Promise<CloudAccount>;
  updateCloudAccount(id: number, account: Partial<InsertCloudAccount>): Promise<CloudAccount | undefined>;
  
  // Compliance Standard operations
  getComplianceStandard(id: number): Promise<ComplianceStandard | undefined>;
  getComplianceStandardByName(name: string): Promise<ComplianceStandard | undefined>;
  getComplianceStandards(enabled?: boolean): Promise<ComplianceStandard[]>;
  createComplianceStandard(standard: InsertComplianceStandard): Promise<ComplianceStandard>;
  updateComplianceStandard(id: number, standard: Partial<InsertComplianceStandard>): Promise<ComplianceStandard | undefined>;
  
  // Compliance Rule operations
  getComplianceRule(id: number): Promise<ComplianceRule | undefined>;
  getComplianceRuleByRuleId(ruleId: string): Promise<ComplianceRule | undefined>;
  getComplianceRules(filters?: {
    standardId?: number;
    severity?: string;
    enabled?: boolean;
    action?: string; // "notify" or "enforce"
    provider?: string;
  }): Promise<ComplianceRule[]>;
  createComplianceRule(rule: InsertComplianceRule): Promise<ComplianceRule>;
  updateComplianceRule(id: number, rule: Partial<InsertComplianceRule>): Promise<ComplianceRule | undefined>;
  
  // Resource Compliance operations
  getResourceCompliance(id: number): Promise<ResourceCompliance | undefined>;
  getResourceComplianceByResourceAndRule(resourceId: number, ruleId: number): Promise<ResourceCompliance | undefined>;
  getResourceComplianceForResource(resourceId: number): Promise<ResourceCompliance[]>;
  getResourceComplianceForRule(ruleId: number, filters?: {
    status?: string;
    accountId?: number;
  }): Promise<ResourceCompliance[]>;
  getNonCompliantResources(accountId?: number, standardId?: number): Promise<{
    resource: Resource;
    rules: ComplianceRule[];
    compliance: ResourceCompliance[];
  }[]>;
  createResourceCompliance(compliance: InsertResourceCompliance): Promise<ResourceCompliance>;
  updateResourceCompliance(id: number, compliance: Partial<InsertResourceCompliance>): Promise<ResourceCompliance | undefined>;
  grantExemption(resourceId: number, ruleId: number, exemptionData: {
    reason: string;
    expiryDate?: Date;
    exemptedBy: number;
  }): Promise<ResourceCompliance | undefined>;
  
  // Account Compliance operations
  getAccountCompliance(id: number): Promise<AccountCompliance | undefined>;
  getAccountComplianceByAccountAndStandard(accountId: number, standardId: number): Promise<AccountCompliance | undefined>;
  getAccountComplianceForAccount(accountId: number): Promise<AccountCompliance[]>;
  calculateAccountCompliance(accountId: number, standardId: number): Promise<AccountCompliance>;
  updateAccountCompliance(id: number, compliance: Partial<InsertAccountCompliance>): Promise<AccountCompliance | undefined>;
}

// Database implementation of IStorage
export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values({
      ...insertUser,
      // Ensure required fields have default values if not provided
      role: insertUser.role || "incident_responder"
    }).returning();
    return user;
  }
  
  // Incident operations
  async getIncident(id: number): Promise<Incident | undefined> {
    const [incident] = await db.select().from(incidents).where(eq(incidents.id, id));
    return incident || undefined;
  }
  
  async getIncidentById(incidentId: string): Promise<Incident | undefined> {
    const [incident] = await db.select().from(incidents).where(eq(incidents.incidentId, incidentId));
    return incident || undefined;
  }
  
  async getIncidents(filters?: {
    severity?: string;
    status?: string;
    timeframe?: string;
  }): Promise<Incident[]> {
    let query = db.select().from(incidents);
    
    if (filters) {
      const conditions = [];
      
      if (filters.severity && filters.severity !== 'All severities') {
        conditions.push(eq(incidents.severity, filters.severity.toLowerCase()));
      }
      
      if (filters.status && filters.status !== 'all') {
        conditions.push(eq(incidents.status, filters.status.toLowerCase()));
      }
      
      if (filters.timeframe && filters.timeframe !== 'All time') {
        const now = new Date();
        let cutoff = new Date();
        
        switch(filters.timeframe) {
          case 'Last 24 hours':
            cutoff.setDate(now.getDate() - 1);
            break;
          case 'Last 7 days':
            cutoff.setDate(now.getDate() - 7);
            break;
          case 'Last 30 days':
            cutoff.setDate(now.getDate() - 30);
            break;
        }
        
        conditions.push(gt(incidents.detectedAt, cutoff));
      }
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
    }
    
    // Sort by detected time, most recent first
    return await query.orderBy(desc(incidents.detectedAt));
  }
  
  async createIncident(insertIncident: InsertIncident): Promise<Incident> {
    const dataToInsert = {
      ...insertIncident,
      // Ensure required fields have default values
      updatedAt: insertIncident.detectedAt || new Date()
    };
  
    const [incident] = await db.insert(incidents).values(dataToInsert).returning();
    return incident;
  }
  
  async updateIncident(id: number, incidentUpdate: Partial<InsertIncident>): Promise<Incident | undefined> {
    // Add updatedAt field
    const updatedIncident = {
      ...incidentUpdate,
      updatedAt: new Date()
    };
    
    const [incident] = await db
      .update(incidents)
      .set(updatedIncident)
      .where(eq(incidents.id, id))
      .returning();
    
    return incident || undefined;
  }
  
  // Resource operations
  async getResource(id: number): Promise<Resource | undefined> {
    const [resource] = await db.select().from(resources).where(eq(resources.id, id));
    return resource || undefined;
  }
  
  async getResourceById(resourceId: string): Promise<Resource | undefined> {
    const [resource] = await db.select().from(resources).where(eq(resources.resourceId, resourceId));
    return resource || undefined;
  }
  
  async getResources(filters?: {
    resourceType?: string;
    region?: string;
    status?: string;
  }): Promise<Resource[]> {
    let query = db.select().from(resources);
    
    if (filters) {
      const conditions = [];
      
      if (filters.resourceType && filters.resourceType !== 'All resources') {
        conditions.push(eq(resources.resourceType, filters.resourceType));
      }
      
      if (filters.region && filters.region !== 'All regions') {
        conditions.push(eq(resources.region, filters.region));
      }
      
      if (filters.status) {
        conditions.push(like(resources.status, `%${filters.status}%`));
      }
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
    }
    
    // Sort by discovered time, most recent first
    return await query.orderBy(desc(resources.discoveredAt));
  }
  
  async createResource(insertResource: InsertResource): Promise<Resource> {
    const dataToInsert = {
      ...insertResource,
      // Ensure required fields have default values
      status: insertResource.status || "normal"
    };
    
    const [resource] = await db.insert(resources).values(dataToInsert).returning();
    return resource;
  }
  
  async updateResource(id: number, resourceUpdate: Partial<InsertResource>): Promise<Resource | undefined> {
    const [resource] = await db
      .update(resources)
      .set(resourceUpdate)
      .where(eq(resources.id, id))
      .returning();
    
    return resource || undefined;
  }
  
  // Timeline operations
  async getTimelineEvents(incidentId: number): Promise<TimelineEvent[]> {
    const events = await db
      .select()
      .from(timelineEvents)
      .where(eq(timelineEvents.incidentId, incidentId))
      .orderBy(timelineEvents.timestamp);
    
    return events;
  }
  
  async createTimelineEvent(insertEvent: InsertTimelineEvent): Promise<TimelineEvent> {
    const [event] = await db.insert(timelineEvents).values({
      ...insertEvent,
      // Ensure timestamp exists
      timestamp: insertEvent.timestamp || new Date()
    }).returning();
    
    return event;
  }
  
  // Resource Log operations
  async getResourceLogs(resourceId: number, filters?: {
    startDate?: Date;
    endDate?: Date;
    actionType?: string;
    region?: string;
  }): Promise<ResourceLog[]> {
    // Query all logs for the resource first
    const allLogs = await db.select()
      .from(resourceLogs)
      .where(eq(resourceLogs.resourceId, resourceId))
      .orderBy(desc(resourceLogs.timestamp));
    
    // If no filters, return all logs
    if (!filters) {
      return allLogs;
    }
    
    // Apply filters in memory (safer than SQL for date filtering with Drizzle)
    return allLogs.filter(log => {
      const logDate = new Date(log.timestamp);
      
      // Filter by start date
      if (filters.startDate && logDate < filters.startDate) {
        return false;
      }
      
      // Filter by end date
      if (filters.endDate && logDate > filters.endDate) {
        return false;
      }
      
      // Filter by actionType
      if (filters.actionType && log.actionType !== filters.actionType) {
        return false;
      }
      
      // Filter by region
      if (filters.region && log.region !== filters.region) {
        return false;
      }
      
      return true;
    });
  }
  
  async createResourceLog(insertLog: InsertResourceLog): Promise<ResourceLog> {
    const [log] = await db.insert(resourceLogs).values({
      ...insertLog,
      // Ensure timestamp exists
      timestamp: insertLog.timestamp || new Date()
    }).returning();
    
    return log;
  }
  
  // Cloud Account operations
  async getCloudAccount(id: number): Promise<CloudAccount | undefined> {
    const [account] = await db.select().from(cloudAccounts).where(eq(cloudAccounts.id, id));
    return account || undefined;
  }
  
  async getCloudAccountById(accountId: string): Promise<CloudAccount | undefined> {
    const [account] = await db.select().from(cloudAccounts).where(eq(cloudAccounts.accountId, accountId));
    return account || undefined;
  }
  
  async getCloudAccounts(filters?: {
    provider?: string;
    status?: string;
  }): Promise<CloudAccount[]> {
    let query = db.select().from(cloudAccounts);
    
    if (filters) {
      const conditions = [];
      
      if (filters.provider && filters.provider !== 'all') {
        conditions.push(eq(cloudAccounts.provider, filters.provider.toLowerCase()));
      }
      
      if (filters.status && filters.status !== 'all') {
        conditions.push(eq(cloudAccounts.status, filters.status.toLowerCase()));
      }
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
    }
    
    // Sort by creation time, most recent first
    return await query.orderBy(desc(cloudAccounts.createdAt));
  }
  
  async createCloudAccount(insertAccount: InsertCloudAccount): Promise<CloudAccount> {
    const dataToInsert = {
      ...insertAccount,
      // Ensure required fields have default values
      status: insertAccount.status || "active"
    };
    
    const [account] = await db.insert(cloudAccounts).values(dataToInsert).returning();
    return account;
  }
  
  async updateCloudAccount(id: number, accountUpdate: Partial<InsertCloudAccount>): Promise<CloudAccount | undefined> {
    const [account] = await db
      .update(cloudAccounts)
      .set(accountUpdate)
      .where(eq(cloudAccounts.id, id))
      .returning();
    
    return account || undefined;
  }
  
  // Compliance Standard operations
  async getComplianceStandard(id: number): Promise<ComplianceStandard | undefined> {
    const [standard] = await db.select().from(complianceStandards).where(eq(complianceStandards.id, id));
    return standard || undefined;
  }
  
  async getComplianceStandardByName(name: string): Promise<ComplianceStandard | undefined> {
    const [standard] = await db.select().from(complianceStandards).where(eq(complianceStandards.name, name));
    return standard || undefined;
  }
  
  async getComplianceStandards(enabled?: boolean): Promise<ComplianceStandard[]> {
    let query = db.select().from(complianceStandards);
    
    if (enabled !== undefined) {
      query = query.where(eq(complianceStandards.enabled, enabled));
    }
    
    return await query;
  }
  
  async createComplianceStandard(standard: InsertComplianceStandard): Promise<ComplianceStandard> {
    const [result] = await db.insert(complianceStandards).values(standard).returning();
    return result;
  }
  
  async updateComplianceStandard(id: number, standard: Partial<InsertComplianceStandard>): Promise<ComplianceStandard | undefined> {
    const [result] = await db
      .update(complianceStandards)
      .set(standard)
      .where(eq(complianceStandards.id, id))
      .returning();
    
    return result || undefined;
  }
  
  // Compliance Rule operations
  async getComplianceRule(id: number): Promise<ComplianceRule | undefined> {
    const [rule] = await db.select().from(complianceRules).where(eq(complianceRules.id, id));
    return rule || undefined;
  }
  
  async getComplianceRuleByRuleId(ruleId: string): Promise<ComplianceRule | undefined> {
    const [rule] = await db.select().from(complianceRules).where(eq(complianceRules.ruleId, ruleId));
    return rule || undefined;
  }
  
  async getComplianceRules(filters?: {
    standardId?: number;
    severity?: string;
    enabled?: boolean;
    action?: string;
    provider?: string;
  }): Promise<ComplianceRule[]> {
    let query = db.select().from(complianceRules);
    
    if (filters) {
      const conditions = [];
      
      if (filters.standardId !== undefined) {
        conditions.push(eq(complianceRules.standardId, filters.standardId));
      }
      
      if (filters.severity) {
        conditions.push(eq(complianceRules.severity, filters.severity));
      }
      
      if (filters.enabled !== undefined) {
        conditions.push(eq(complianceRules.enabled, filters.enabled));
      }
      
      if (filters.action) {
        conditions.push(eq(complianceRules.action, filters.action));
      }
      
      if (filters.provider) {
        // Check if the provider is in the providers array of the rule
        // This requires custom SQL that may vary by database, for now we'll handle this in application code
        // and fetch all rules, then filter
        // In a production app, use a proper database-specific query for array contains
      }
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
    }
    
    const rules = await query;
    
    // If provider filter is specified, filter in application code
    if (filters?.provider) {
      return rules.filter(rule => 
        rule.providers?.includes(filters.provider as string)
      );
    }
    
    return rules;
  }
  
  async createComplianceRule(rule: InsertComplianceRule): Promise<ComplianceRule> {
    const [result] = await db.insert(complianceRules).values(rule).returning();
    return result;
  }
  
  async updateComplianceRule(id: number, rule: Partial<InsertComplianceRule>): Promise<ComplianceRule | undefined> {
    const [result] = await db
      .update(complianceRules)
      .set(rule)
      .where(eq(complianceRules.id, id))
      .returning();
    
    return result || undefined;
  }
  
  // Resource Compliance operations
  async getResourceCompliance(id: number): Promise<ResourceCompliance | undefined> {
    const [compliance] = await db.select().from(resourceCompliance).where(eq(resourceCompliance.id, id));
    return compliance || undefined;
  }
  
  async getResourceComplianceByResourceAndRule(resourceId: number, ruleId: number): Promise<ResourceCompliance | undefined> {
    const [compliance] = await db.select().from(resourceCompliance)
      .where(and(
        eq(resourceCompliance.resourceId, resourceId), 
        eq(resourceCompliance.ruleId, ruleId)
      ));
    return compliance || undefined;
  }
  
  async getResourceComplianceForResource(resourceId: number): Promise<ResourceCompliance[]> {
    return await db.select().from(resourceCompliance)
      .where(eq(resourceCompliance.resourceId, resourceId));
  }
  
  async getResourceComplianceForRule(ruleId: number, filters?: {
    status?: string;
    accountId?: number;
  }): Promise<ResourceCompliance[]> {
    let query = db.select().from(resourceCompliance)
      .where(eq(resourceCompliance.ruleId, ruleId));
    
    if (filters?.status) {
      query = query.where(eq(resourceCompliance.status, filters.status));
    }
    
    // If accountId is specified, we need to join with resources and/or cloud accounts
    // This is beyond the scope of this implementation, but in a real app,
    // this would involve joining tables to filter by account
    
    return await query;
  }
  
  async getNonCompliantResources(accountId?: number, standardId?: number): Promise<{
    resource: Resource;
    rules: ComplianceRule[];
    compliance: ResourceCompliance[];
  }[]> {
    // This is a complex query that would typically involve multiple joins
    // For this implementation, we'll do it in multiple queries and compose in application code
    
    // Get all non-compliant resource compliance entries
    const complianceEntries = await db.select().from(resourceCompliance)
      .where(eq(resourceCompliance.status, "non_compliant"));
    
    if (complianceEntries.length === 0) {
      return [];
    }
    
    // Get unique resource IDs
    const resourceIds = [...new Set(complianceEntries.map(c => c.resourceId))];
    
    // Get resources
    const resourceList = await db.select().from(resources)
      .where(resourceIds.map(id => eq(resources.id, id)).length > 0 ? 
        resourceIds.length === 1 ? 
          eq(resources.id, resourceIds[0]) : 
          or(...resourceIds.map(id => eq(resources.id, id))) 
        : undefined);
    
    if (resourceList.length === 0) {
      return [];
    }
    
    // Get rule IDs
    const ruleIds = [...new Set(complianceEntries.map(c => c.ruleId))];
    
    // Get rules
    let rulesQuery = db.select().from(complianceRules)
      .where(ruleIds.map(id => eq(complianceRules.id, id)).length > 0 ? 
        ruleIds.length === 1 ? 
          eq(complianceRules.id, ruleIds[0]) : 
          or(...ruleIds.map(id => eq(complianceRules.id, id))) 
        : undefined);
    
    // Filter by standard if specified
    if (standardId !== undefined) {
      rulesQuery = rulesQuery.where(eq(complianceRules.standardId, standardId));
    }
    
    const rules = await rulesQuery;
    
    // Group by resource
    const result = resourceList.map(resource => {
      const resourceComplianceEntries = complianceEntries.filter(c => c.resourceId === resource.id);
      const relevantRuleIds = resourceComplianceEntries.map(c => c.ruleId);
      const relevantRules = rules.filter(r => relevantRuleIds.includes(r.id));
      
      return {
        resource,
        rules: relevantRules,
        compliance: resourceComplianceEntries
      };
    });
    
    return result;
  }
  
  async createResourceCompliance(compliance: InsertResourceCompliance): Promise<ResourceCompliance> {
    const [result] = await db.insert(resourceCompliance).values(compliance).returning();
    return result;
  }
  
  async updateResourceCompliance(id: number, compliance: Partial<InsertResourceCompliance>): Promise<ResourceCompliance | undefined> {
    const [result] = await db
      .update(resourceCompliance)
      .set(compliance)
      .where(eq(resourceCompliance.id, id))
      .returning();
    
    return result || undefined;
  }
  
  async grantExemption(resourceId: number, ruleId: number, exemptionData: {
    reason: string;
    expiryDate?: Date;
    exemptedBy: number;
  }): Promise<ResourceCompliance | undefined> {
    // First, check if the compliance record exists
    const compliance = await this.getResourceComplianceByResourceAndRule(resourceId, ruleId);
    
    if (!compliance) {
      return undefined;
    }
    
    // Update the compliance record with exemption data
    const [result] = await db
      .update(resourceCompliance)
      .set({
        status: "exempted",
        exemptionReason: exemptionData.reason,
        exemptionExpiry: exemptionData.expiryDate,
        exemptedBy: exemptionData.exemptedBy,
        exemptedAt: new Date()
      })
      .where(and(
        eq(resourceCompliance.resourceId, resourceId),
        eq(resourceCompliance.ruleId, ruleId)
      ))
      .returning();
    
    return result || undefined;
  }
  
  // Account Compliance operations
  async getAccountCompliance(id: number): Promise<AccountCompliance | undefined> {
    const [compliance] = await db.select().from(accountCompliance).where(eq(accountCompliance.id, id));
    return compliance || undefined;
  }
  
  async getAccountComplianceByAccountAndStandard(accountId: number, standardId: number): Promise<AccountCompliance | undefined> {
    const [compliance] = await db.select().from(accountCompliance)
      .where(and(
        eq(accountCompliance.accountId, accountId),
        eq(accountCompliance.standardId, standardId)
      ));
    return compliance || undefined;
  }
  
  async getAccountComplianceForAccount(accountId: number): Promise<AccountCompliance[]> {
    return await db.select().from(accountCompliance)
      .where(eq(accountCompliance.accountId, accountId));
  }
  
  async calculateAccountCompliance(accountId: number, standardId: number): Promise<AccountCompliance> {
    // This would be a complex operation that combines data from multiple tables
    // For this implementation, we'll create a simpler version
    
    // Get the standard
    const standard = await this.getComplianceStandard(standardId);
    if (!standard) {
      throw new Error(`Compliance standard with ID ${standardId} not found`);
    }
    
    // Get the account
    const account = await this.getCloudAccount(accountId);
    if (!account) {
      throw new Error(`Cloud account with ID ${accountId} not found`);
    }
    
    // Get all resources for this account
    // Note: In a real app, you would need to join with cloud accounts to get resources
    // For now, we'll assume all resources in our system belong to this account
    const resources = await this.getResources();
    
    // Get all rules for this standard
    const rules = await this.getComplianceRules({ standardId });
    
    // Counter for compliance statuses
    let compliantCount = 0;
    let nonCompliantCount = 0;
    let exemptedCount = 0;
    let notApplicableCount = 0;
    
    // For each resource and rule combination, check compliance
    for (const resource of resources) {
      for (const rule of rules) {
        // Check if the rule applies to this resource type
        if (!rule.resourceTypes.includes(resource.resourceType)) {
          notApplicableCount++;
          continue;
        }
        
        // Check if the rule applies to this cloud provider
        if (!rule.providers.includes(account.provider)) {
          notApplicableCount++;
          continue;
        }
        
        // Get or create the compliance status
        const compliance = await this.getResourceComplianceByResourceAndRule(resource.id, rule.id);
        
        if (!compliance) {
          // Create a new compliance entry as non-compliant by default
          await this.createResourceCompliance({
            resourceId: resource.id,
            ruleId: rule.id,
            status: "non_compliant",
            lastChecked: new Date(),
            details: { message: "Initial compliance check" }
          });
          nonCompliantCount++;
        } else {
          // Count by status
          switch (compliance.status) {
            case "compliant":
              compliantCount++;
              break;
            case "non_compliant":
              nonCompliantCount++;
              break;
            case "exempted":
              exemptedCount++;
              break;
            case "not_applicable":
              notApplicableCount++;
              break;
          }
        }
      }
    }
    
    // Determine overall status
    const overallStatus = nonCompliantCount === 0 ? "compliant" : "non_compliant";
    
    // Get or create account compliance record
    const existingCompliance = await this.getAccountComplianceByAccountAndStandard(accountId, standardId);
    
    if (existingCompliance) {
      // Update existing record
      return await this.updateAccountCompliance(existingCompliance.id, {
        compliantRules: compliantCount,
        nonCompliantRules: nonCompliantCount,
        exemptedRules: exemptedCount,
        notApplicableRules: notApplicableCount,
        lastScanned: new Date(),
        overallStatus
      }) as AccountCompliance;
    } else {
      // Create new record
      return await db.insert(accountCompliance).values({
        accountId,
        standardId,
        compliantRules: compliantCount,
        nonCompliantRules: nonCompliantCount,
        exemptedRules: exemptedCount,
        notApplicableRules: notApplicableCount,
        lastScanned: new Date(),
        overallStatus
      }).returning()[0];
    }
  }
  
  async updateAccountCompliance(id: number, compliance: Partial<InsertAccountCompliance>): Promise<AccountCompliance | undefined> {
    const [result] = await db
      .update(accountCompliance)
      .set(compliance)
      .where(eq(accountCompliance.id, id))
      .returning();
    
    return result || undefined;
  }
  
  // Method to seed compliance data separately
  async seedComplianceData() {
    // Check if compliance standards table is empty
    const standardsCount = await db.select().from(complianceStandards);
    if (standardsCount.length === 0) {
      console.log("Seeding compliance data...");
      
      // Compliance Standards
      const nistStandard: InsertComplianceStandard = {
        name: "nist_800_53",
        displayName: "NIST 800-53",
        description: "Security and Privacy Controls for Federal Information Systems and Organizations, providing a catalog of security and privacy controls for all US federal information systems except those related to national security.",
        version: "Rev. 5",
        category: "Federal",
        link: "https://csrc.nist.gov/publications/detail/sp/800-53/rev-5/final",
        enabled: true
      };
      const nistStandardCreated = await this.createComplianceStandard(nistStandard);
      
      const pciStandard: InsertComplianceStandard = {
        name: "pci_dss",
        displayName: "PCI DSS",
        description: "Payment Card Industry Data Security Standard, a set of security standards designed to ensure that ALL companies that accept, process, store or transmit credit card information maintain a secure environment.",
        version: "4.0",
        category: "Industry",
        link: "https://www.pcisecuritystandards.org/",
        enabled: true
      };
      const pciStandardCreated = await this.createComplianceStandard(pciStandard);
      
      const hipaaStandard: InsertComplianceStandard = {
        name: "hipaa",
        displayName: "HIPAA",
        description: "Health Insurance Portability and Accountability Act, which establishes national standards for protecting sensitive patient health information from being disclosed without the patient's consent or knowledge.",
        version: "2023",
        category: "Healthcare",
        link: "https://www.hhs.gov/hipaa/",
        enabled: true
      };
      const hipaaStandardCreated = await this.createComplianceStandard(hipaaStandard);
      
      // Compliance Rules for NIST
      const nistRule1: InsertComplianceRule = {
        standardId: nistStandardCreated.id,
        ruleId: "NIST-AC-3",
        title: "Access Enforcement",
        description: "The system must enforce approved authorizations for logical access to information and system resources in accordance with applicable access control policies.",
        severity: "high",
        resourceTypes: ["EC2", "IAM"],
        action: "enforce",
        remediationSteps: "Implement proper IAM policies and security groups to restrict access to resources based on least privilege principles.",
        enabled: true,
        providers: ["aws", "azure"]
      };
      await this.createComplianceRule(nistRule1);
      
      const nistRule2: InsertComplianceRule = {
        standardId: nistStandardCreated.id,
        ruleId: "NIST-AC-17",
        title: "Remote Access",
        description: "The system must enforce requirements for remote connections to the information system.",
        severity: "high",
        resourceTypes: ["EC2", "VPC", "SecurityGroup"],
        action: "enforce",
        remediationSteps: "Ensure that all remote access to systems requires multi-factor authentication and encrypted communications.",
        enabled: true,
        providers: ["aws", "azure", "gcp"]
      };
      await this.createComplianceRule(nistRule2);
      
      const nistRule3: InsertComplianceRule = {
        standardId: nistStandardCreated.id,
        ruleId: "NIST-CP-9",
        title: "System Backup",
        description: "The organization must conduct backups of system-level information, system documentation, and user-level information.",
        severity: "medium",
        resourceTypes: ["EC2", "RDS", "S3"],
        action: "notify",
        remediationSteps: "Configure automated backups for all critical systems and data with appropriate retention periods.",
        enabled: true,
        providers: ["aws", "azure"]
      };
      await this.createComplianceRule(nistRule3);
      
      // Compliance Rules for PCI DSS
      const pciRule1: InsertComplianceRule = {
        standardId: pciStandardCreated.id,
        ruleId: "PCI-1.3.2",
        title: "Public Access Restriction",
        description: "Restrict inbound Internet traffic to Internet-facing systems and prohibit direct public access between the Internet and any system component in the cardholder data environment.",
        severity: "critical",
        resourceTypes: ["EC2", "SecurityGroup", "LoadBalancer"],
        action: "enforce",
        remediationSteps: "Implement firewalls and security groups to restrict traffic between public internet and systems containing cardholder data.",
        enabled: true,
        providers: ["aws", "azure"]
      };
      await this.createComplianceRule(pciRule1);
      
      const pciRule2: InsertComplianceRule = {
        standardId: pciStandardCreated.id,
        ruleId: "PCI-3.4",
        title: "PAN Storage Protection",
        description: "Render primary account numbers (PAN) unreadable anywhere they are stored by using strong cryptography.",
        severity: "critical",
        resourceTypes: ["S3", "RDS", "DynamoDB"],
        action: "enforce",
        remediationSteps: "Implement encryption for all storage services that may contain cardholder data. Enable encryption at rest and in transit.",
        enabled: true,
        providers: ["aws", "azure", "gcp"]
      };
      await this.createComplianceRule(pciRule2);
      
      const pciRule3: InsertComplianceRule = {
        standardId: pciStandardCreated.id,
        ruleId: "PCI-10.5.3",
        title: "Audit Trail Protection",
        description: "Promptly back up audit trail files to a centralized log server or media that is difficult to alter.",
        severity: "high",
        resourceTypes: ["CloudTrail", "CloudWatch", "EventHub"],
        action: "notify",
        remediationSteps: "Configure CloudTrail logs to be delivered to a dedicated S3 bucket with appropriate access controls and encryption.",
        enabled: true,
        providers: ["aws", "azure"]
      };
      await this.createComplianceRule(pciRule3);
      
      // Compliance Rules for HIPAA
      const hipaaRule1: InsertComplianceRule = {
        standardId: hipaaStandardCreated.id,
        ruleId: "HIPAA-164.312(a)(1)",
        title: "Access Control",
        description: "Implement technical policies and procedures for electronic information systems that maintain electronic protected health information to allow access only to authorized persons or software programs.",
        severity: "high",
        resourceTypes: ["EC2", "IAM", "S3"],
        action: "enforce",
        remediationSteps: "Implement role-based access control and principle of least privilege for all systems containing PHI.",
        enabled: true,
        providers: ["aws", "azure", "gcp"]
      };
      await this.createComplianceRule(hipaaRule1);
      
      const hipaaRule2: InsertComplianceRule = {
        standardId: hipaaStandardCreated.id,
        ruleId: "HIPAA-164.312(e)(1)",
        title: "Transmission Security",
        description: "Implement technical security measures to guard against unauthorized access to electronic protected health information that is being transmitted over an electronic communications network.",
        severity: "high",
        resourceTypes: ["EC2", "LoadBalancer", "API"],
        action: "enforce",
        remediationSteps: "Ensure all data transmissions are encrypted using TLS 1.2 or higher. Configure load balancers to enforce HTTPS.",
        enabled: true,
        providers: ["aws", "azure"]
      };
      await this.createComplianceRule(hipaaRule2);
      
      // Resource Compliance Records (some non-compliant examples)
      await this.createResourceCompliance({
        resourceId: 1, // EC2 resource
        ruleId: 6, // PCI-1.3.2
        status: "non_compliant",
        lastChecked: new Date(),
        details: {
          reason: "Public security group allows unrestricted access on port 22"
        }
      });
      
      await this.createResourceCompliance({
        resourceId: 1, // EC2 resource
        ruleId: 1, // NIST-AC-3
        status: "non_compliant",
        lastChecked: new Date(),
        details: {
          reason: "Instance has overly permissive IAM role attached"
        }
      });
      
      await this.createResourceCompliance({
        resourceId: 3, // IAM resource
        ruleId: 7, // HIPAA-164.312(a)(1)
        status: "non_compliant",
        lastChecked: new Date(),
        details: {
          reason: "IAM policy grants excessive privileges"
        }
      });
      
      // Also add some compliant records
      await this.createResourceCompliance({
        resourceId: 2, // S3 resource
        ruleId: 5, // PCI-3.4
        status: "compliant",
        lastChecked: new Date(),
        details: {
          notes: "Encryption at rest is enabled"
        }
      });
      
      await this.createResourceCompliance({
        resourceId: 4, // Lambda resource
        ruleId: 3, // NIST-CP-9
        status: "compliant",
        lastChecked: new Date(),
        details: {
          notes: "Function code is versioned properly"
        }
      });
      
      // Account compliance calculations
      const accounts = await db.select().from(cloudAccounts);
      if (accounts.length > 0) {
        await this.calculateAccountCompliance(accounts[0].id, nistStandardCreated.id);
        await this.calculateAccountCompliance(accounts[0].id, pciStandardCreated.id);
        if (accounts.length > 2) {
          await this.calculateAccountCompliance(accounts[2].id, hipaaStandardCreated.id);
        }
      }
      
      console.log("Compliance data seeding completed successfully.");
    }
  }
  
  // Seed method to initialize database with sample data
  async seedData() {
    // Check if users table is empty
    const userCount = await db.select().from(users);
    if (userCount.length === 0) {
      console.log("Seeding database with initial data...");
      
      // Create default user
      const user: InsertUser = {
        username: "alexmorgan",
        password: "securepassword", // In a real app, this would be hashed
        fullName: "Alex Morgan",
        role: "incident_responder",
        avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
      };
      const createdUser = await this.createUser(user);
      
      // Create cloud accounts
      const awsAccount1: InsertCloudAccount = {
        accountId: "123456789012",
        provider: "aws",
        name: "Production AWS Account",
        status: "active",
        ownerEmail: "cloudadmin@company.com",
        createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
        lastScannedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        metadata: {
          region: "us-east-1",
          rootUser: "root@company.com",
          vpcCount: 3,
          environment: "production"
        }
      };
      await this.createCloudAccount(awsAccount1);
      
      const awsAccount2: InsertCloudAccount = {
        accountId: "234567890123",
        provider: "aws",
        name: "Development AWS Account",
        status: "active",
        ownerEmail: "devteam@company.com",
        createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000), // 120 days ago
        lastScannedAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        metadata: {
          region: "us-west-2",
          rootUser: "devops@company.com",
          vpcCount: 2,
          environment: "development"
        }
      };
      await this.createCloudAccount(awsAccount2);
      
      const azureAccount1: InsertCloudAccount = {
        accountId: "f8d7c6b5-a4e3-1234-9876-a1b2c3d4e5f6",
        provider: "azure",
        name: "Azure Production Subscription",
        status: "active",
        ownerEmail: "azureadmin@company.com",
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
        lastScannedAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
        metadata: {
          tenantId: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
          location: "East US",
          resourceGroups: 5,
          environment: "production"
        }
      };
      await this.createCloudAccount(azureAccount1);
      
      // Create sample resources
      const ec2Resource: InsertResource = {
        resourceId: "i-09a8d67b5e4c3f21d",
        resourceType: "EC2",
        name: "API Server",
        region: "us-east-1",
        status: "Compromised",
        metadata: {
          type: "t3.medium",
          vpc: "vpc-89a7f3c1"
        },
        isolated: false,
        forensicCopy: false,
        discoveredAt: new Date(Date.now() - 10 * 60 * 1000) // 10 min ago
      };
      await this.createResource(ec2Resource);
      
      const s3Resource: InsertResource = {
        resourceId: "customer-data-prod-e7fb9",
        resourceType: "S3",
        name: "Customer Data Bucket",
        region: "us-west-2",
        status: "Data Exfiltration",
        metadata: {
          access: "Private",
          objects: "~14,500"
        },
        isolated: false,
        forensicCopy: false,
        discoveredAt: new Date(Date.now() - 45 * 60 * 1000) // 45 min ago
      };
      await this.createResource(s3Resource);
      
      const iamResource: InsertResource = {
        resourceId: "developer-jenkins-role",
        resourceType: "IAM",
        name: "Jenkins Role",
        region: "global",
        status: "Privilege Escalation",
        metadata: {
          account: "123456789012",
          service: "EC2",
          access: "Full Admin"
        },
        isolated: false,
        forensicCopy: false,
        discoveredAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
      };
      await this.createResource(iamResource);
      
      const lambdaResource: InsertResource = {
        resourceId: "api-auth-processor",
        resourceType: "Lambda",
        name: "API Auth Processor",
        region: "us-east-1",
        status: "Modified Code",
        metadata: {
          runtime: "Node.js 14.x",
          memory: "512 MB"
        },
        isolated: false,
        forensicCopy: false,
        discoveredAt: new Date(Date.now() - 3 * 60 * 60 * 1000) // 3 hours ago
      };
      await this.createResource(lambdaResource);
      
      // Create sample incidents
      const incident1: InsertIncident = {
        title: "Unauthorized API Access",
        description: "Abnormal activity detected on EC2 instance i-09a8d67b5e4c3f21d in us-east-1 region. Unauthorized API calls were made using the instance profile credentials. Network traffic analysis shows potential data exfiltration to unknown external IP.",
        severity: "critical",
        status: "active",
        detectedAt: new Date(Date.now() - 10 * 60 * 1000), // 10 min ago
        updatedAt: new Date(Date.now() - 10 * 60 * 1000), // Same as detected
        affectedResources: ["i-09a8d67b5e4c3f21d", "vpc-89a7f3c1"],
        assignedTo: createdUser.id,
        incidentId: "INC-20230715-0053"
      };
      const createdIncident1 = await this.createIncident(incident1);
      
      const incident2: InsertIncident = {
        title: "S3 Bucket Data Exfiltration",
        description: "Unusual access patterns detected on customer data bucket. Large volume of GetObject requests from unfamiliar IP addresses. Potential customer data breach.",
        severity: "critical",
        status: "active",
        detectedAt: new Date(Date.now() - 45 * 60 * 1000), // 45 min ago
        updatedAt: new Date(Date.now() - 45 * 60 * 1000), // Same as detected
        affectedResources: ["customer-data-prod-e7fb9"],
        assignedTo: createdUser.id,
        incidentId: "INC-20230715-0052"
      };
      await this.createIncident(incident2);
      
      const incident3: InsertIncident = {
        title: "IAM Privilege Escalation",
        description: "Jenkins role has been modified to gain admin privileges. Suspicious policy attachments detected.",
        severity: "high",
        status: "active",
        detectedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // Same as detected
        affectedResources: ["developer-jenkins-role"],
        assignedTo: createdUser.id,
        incidentId: "INC-20230715-0051"
      };
      await this.createIncident(incident3);
      
      // Create timeline events for first incident
      const timeline1: InsertTimelineEvent = {
        incidentId: createdIncident1.id,
        timestamp: new Date(Date.now() - (10 * 60 * 1000)),
        eventType: "initial_access",
        description: "Suspicious login detected from IP 203.0.113.42 (Geo: Russia) using compromised credentials.",
        severity: "critical"
      };
      await this.createTimelineEvent(timeline1);
      
      const timeline2: InsertTimelineEvent = {
        incidentId: createdIncident1.id,
        timestamp: new Date(Date.now() - (9 * 60 * 1000) - 15000),
        eventType: "privilege_escalation",
        description: "Attacker modified IAM role permissions to gain admin access to EC2 instance.",
        severity: "critical"
      };
      await this.createTimelineEvent(timeline2);
      
      const timeline3: InsertTimelineEvent = {
        incidentId: createdIncident1.id,
        timestamp: new Date(Date.now() - (9 * 60 * 1000) - 30000),
        eventType: "lateral_movement",
        description: "Access to additional EC2 instances in the same VPC detected from compromised instance.",
        severity: "high"
      };
      await this.createTimelineEvent(timeline3);
      
      const timeline4: InsertTimelineEvent = {
        incidentId: createdIncident1.id,
        timestamp: new Date(Date.now() - (8 * 60 * 1000)),
        eventType: "discovery",
        description: "Multiple DescribeInstances, ListBuckets API calls detected from compromised instance.",
        severity: "high"
      };
      await this.createTimelineEvent(timeline4);
      
      const timeline5: InsertTimelineEvent = {
        incidentId: createdIncident1.id,
        timestamp: new Date(Date.now() - (7 * 60 * 1000)),
        eventType: "data_collection",
        description: "Unauthorized S3 GetObject calls to customer-data-prod-e7fb9 bucket detected.",
        severity: "critical"
      };
      await this.createTimelineEvent(timeline5);
      
      const timeline6: InsertTimelineEvent = {
        incidentId: createdIncident1.id,
        timestamp: new Date(Date.now() - (6 * 60 * 1000)),
        eventType: "alert_triggered",
        description: "GuardDuty detected unusual API activity and triggered a security alert.",
        severity: "info"
      };
      await this.createTimelineEvent(timeline6);
      
      // Skip cloud accounts as they are defined above
      
      // Compliance Standards
      const nistStandard: InsertComplianceStandard = {
        name: "nist_800_53",
        displayName: "NIST 800-53",
        description: "Security and Privacy Controls for Federal Information Systems and Organizations, providing a catalog of security and privacy controls for all US federal information systems except those related to national security.",
        version: "Rev. 5",
        category: "Federal",
        link: "https://csrc.nist.gov/publications/detail/sp/800-53/rev-5/final",
        enabled: true
      };
      const nistStandardCreated = await this.createComplianceStandard(nistStandard);
      
      const pciStandard: InsertComplianceStandard = {
        name: "pci_dss",
        displayName: "PCI DSS",
        description: "Payment Card Industry Data Security Standard, a set of security standards designed to ensure that ALL companies that accept, process, store or transmit credit card information maintain a secure environment.",
        version: "4.0",
        category: "Industry",
        link: "https://www.pcisecuritystandards.org/",
        enabled: true
      };
      const pciStandardCreated = await this.createComplianceStandard(pciStandard);
      
      const hipaaStandard: InsertComplianceStandard = {
        name: "hipaa",
        displayName: "HIPAA",
        description: "Health Insurance Portability and Accountability Act, which establishes national standards for protecting sensitive patient health information from being disclosed without the patient's consent or knowledge.",
        version: "2023",
        category: "Healthcare",
        link: "https://www.hhs.gov/hipaa/",
        enabled: true
      };
      const hipaaStandardCreated = await this.createComplianceStandard(hipaaStandard);
      
      // Compliance Rules for NIST
      const nistRule1: InsertComplianceRule = {
        standardId: nistStandardCreated.id,
        ruleId: "NIST-AC-3",
        title: "Access Enforcement",
        description: "The system must enforce approved authorizations for logical access to information and system resources in accordance with applicable access control policies.",
        severity: "high",
        resourceTypes: ["EC2", "IAM"],
        action: "enforce",
        remediationSteps: "Implement proper IAM policies and security groups to restrict access to resources based on least privilege principles.",
        enabled: true,
        providers: ["aws", "azure"]
      };
      await this.createComplianceRule(nistRule1);
      
      const nistRule2: InsertComplianceRule = {
        standardId: nistStandardCreated.id,
        ruleId: "NIST-AC-17",
        title: "Remote Access",
        description: "The system must enforce requirements for remote connections to the information system.",
        severity: "high",
        resourceTypes: ["EC2", "VPC", "SecurityGroup"],
        action: "enforce",
        remediationSteps: "Ensure that all remote access to systems requires multi-factor authentication and encrypted communications.",
        enabled: true,
        providers: ["aws", "azure", "gcp"]
      };
      await this.createComplianceRule(nistRule2);
      
      const nistRule3: InsertComplianceRule = {
        standardId: nistStandardCreated.id,
        ruleId: "NIST-CP-9",
        title: "System Backup",
        description: "The organization must conduct backups of system-level information, system documentation, and user-level information.",
        severity: "medium",
        resourceTypes: ["EC2", "RDS", "S3"],
        action: "notify",
        remediationSteps: "Configure automated backups for all critical systems and data with appropriate retention periods.",
        enabled: true,
        providers: ["aws", "azure"]
      };
      await this.createComplianceRule(nistRule3);
      
      // Compliance Rules for PCI DSS
      const pciRule1: InsertComplianceRule = {
        standardId: pciStandardCreated.id,
        ruleId: "PCI-1.3.2",
        title: "Public Access Restriction",
        description: "Restrict inbound Internet traffic to Internet-facing systems and prohibit direct public access between the Internet and any system component in the cardholder data environment.",
        severity: "critical",
        resourceTypes: ["EC2", "SecurityGroup", "LoadBalancer"],
        action: "enforce",
        remediationSteps: "Implement firewalls and security groups to restrict traffic between public internet and systems containing cardholder data.",
        enabled: true,
        providers: ["aws", "azure"]
      };
      await this.createComplianceRule(pciRule1);
      
      const pciRule2: InsertComplianceRule = {
        standardId: pciStandardCreated.id,
        ruleId: "PCI-3.4",
        title: "PAN Storage Protection",
        description: "Render primary account numbers (PAN) unreadable anywhere they are stored by using strong cryptography.",
        severity: "critical",
        resourceTypes: ["S3", "RDS", "DynamoDB"],
        action: "enforce",
        remediationSteps: "Implement encryption for all storage services that may contain cardholder data. Enable encryption at rest and in transit.",
        enabled: true,
        providers: ["aws", "azure", "gcp"]
      };
      await this.createComplianceRule(pciRule2);
      
      const pciRule3: InsertComplianceRule = {
        standardId: pciStandardCreated.id,
        ruleId: "PCI-10.5.3",
        title: "Audit Trail Protection",
        description: "Promptly back up audit trail files to a centralized log server or media that is difficult to alter.",
        severity: "high",
        resourceTypes: ["CloudTrail", "CloudWatch", "EventHub"],
        action: "notify",
        remediationSteps: "Configure CloudTrail logs to be delivered to a dedicated S3 bucket with appropriate access controls and encryption.",
        enabled: true,
        providers: ["aws", "azure"]
      };
      await this.createComplianceRule(pciRule3);
      
      // Compliance Rules for HIPAA
      const hipaaRule1: InsertComplianceRule = {
        standardId: hipaaStandardCreated.id,
        ruleId: "HIPAA-164.312(a)(1)",
        title: "Access Control",
        description: "Implement technical policies and procedures for electronic information systems that maintain electronic protected health information to allow access only to authorized persons or software programs.",
        severity: "high",
        resourceTypes: ["EC2", "IAM", "S3"],
        action: "enforce",
        remediationSteps: "Implement role-based access control and principle of least privilege for all systems containing PHI.",
        enabled: true,
        providers: ["aws", "azure", "gcp"]
      };
      await this.createComplianceRule(hipaaRule1);
      
      const hipaaRule2: InsertComplianceRule = {
        standardId: hipaaStandardCreated.id,
        ruleId: "HIPAA-164.312(e)(1)",
        title: "Transmission Security",
        description: "Implement technical security measures to guard against unauthorized access to electronic protected health information that is being transmitted over an electronic communications network.",
        severity: "high",
        resourceTypes: ["EC2", "LoadBalancer", "API"],
        action: "enforce",
        remediationSteps: "Ensure all data transmissions are encrypted using TLS 1.2 or higher. Configure load balancers to enforce HTTPS.",
        enabled: true,
        providers: ["aws", "azure"]
      };
      await this.createComplianceRule(hipaaRule2);
      
      // Resource Compliance Records (some non-compliant examples)
      await this.createResourceCompliance({
        resourceId: 1, // EC2 resource
        ruleId: 6, // PCI-1.3.2
        status: "non_compliant",
        lastChecked: new Date(),
        details: {
          reason: "Public security group allows unrestricted access on port 22"
        }
      });
      
      await this.createResourceCompliance({
        resourceId: 1, // EC2 resource
        ruleId: 1, // NIST-AC-3
        status: "non_compliant",
        lastChecked: new Date(),
        details: {
          reason: "Instance has overly permissive IAM role attached"
        }
      });
      
      await this.createResourceCompliance({
        resourceId: 3, // IAM resource
        ruleId: 7, // HIPAA-164.312(a)(1)
        status: "non_compliant",
        lastChecked: new Date(),
        details: {
          reason: "IAM policy grants excessive privileges"
        }
      });
      
      // Also add some compliant records
      await this.createResourceCompliance({
        resourceId: 2, // S3 resource
        ruleId: 5, // PCI-3.4
        status: "compliant",
        lastChecked: new Date(),
        details: {
          notes: "Encryption at rest is enabled"
        }
      });
      
      await this.createResourceCompliance({
        resourceId: 4, // Lambda resource
        ruleId: 3, // NIST-CP-9
        status: "compliant",
        lastChecked: new Date(),
        details: {
          notes: "Function code is versioned properly"
        }
      });
      
      // Account compliance calculations
      await this.calculateAccountCompliance(1, nistStandardCreated.id); // AWS Prod with NIST
      await this.calculateAccountCompliance(1, pciStandardCreated.id); // AWS Prod with PCI
      await this.calculateAccountCompliance(3, hipaaStandardCreated.id); // Azure Prod with HIPAA
      
      console.log("Database seeding completed successfully.");
    }
  }
}

// Export an instance of DatabaseStorage
export const storage = new DatabaseStorage();
