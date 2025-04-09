import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { and, ne } from "drizzle-orm";
import { db } from "./db";
import { 
  insertIncidentSchema,
  insertResourceSchema,
  insertTimelineEventSchema,
  insertResourceLogSchema,
  insertCloudAccountSchema,
  insertComplianceStandardSchema,
  insertComplianceRuleSchema,
  insertResourceComplianceSchema,
  resourceCompliance
} from "@shared/schema";
import { predictIncidentSeverity } from "./services/aiPredictor";

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes prefix
  const apiRouter = express.Router();
  app.use("/api", apiRouter);

  // User routes
  apiRouter.get("/user", async (req: Request, res: Response) => {
    // For demo purposes, always return the default user
    const user = await storage.getUserByUsername("alexmorgan");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.json(user);
  });

  // Get all incidents with optional filters
  apiRouter.get("/incidents", async (req: Request, res: Response) => {
    const severity = req.query.severity as string | undefined;
    const status = req.query.status as string | undefined;
    const timeframe = req.query.timeframe as string | undefined;
    
    const incidents = await storage.getIncidents({
      severity, 
      status,
      timeframe
    });
    
    return res.json(incidents);
  });

  // Get single incident by ID
  apiRouter.get("/incidents/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid incident ID" });
    }
    
    const incident = await storage.getIncident(id);
    if (!incident) {
      return res.status(404).json({ message: "Incident not found" });
    }
    
    return res.json(incident);
  });
  
  // Create incident
  apiRouter.post("/incidents", async (req: Request, res: Response) => {
    try {
      const incidentData = insertIncidentSchema.parse(req.body);
      const incident = await storage.createIncident(incidentData);
      return res.status(201).json(incident);
    } catch (error) {
      return res.status(400).json({ message: "Invalid incident data", error });
    }
  });
  
  // Update incident
  apiRouter.patch("/incidents/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid incident ID" });
    }
    
    try {
      const updateSchema = insertIncidentSchema.partial();
      const updateData = updateSchema.parse(req.body);
      
      const incident = await storage.updateIncident(id, updateData);
      if (!incident) {
        return res.status(404).json({ message: "Incident not found" });
      }
      
      return res.json(incident);
    } catch (error) {
      return res.status(400).json({ message: "Invalid update data", error });
    }
  });
  
  // Get resources with optional filters
  apiRouter.get("/resources", async (req: Request, res: Response) => {
    const resourceType = req.query.resourceType as string | undefined;
    const region = req.query.region as string | undefined;
    const status = req.query.status as string | undefined;
    
    const resources = await storage.getResources({
      resourceType,
      region,
      status
    });
    
    return res.json(resources);
  });
  
  // Get single resource by ID
  apiRouter.get("/resources/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid resource ID" });
    }
    
    const resource = await storage.getResource(id);
    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }
    
    return res.json(resource);
  });
  
  // Create resource
  apiRouter.post("/resources", async (req: Request, res: Response) => {
    try {
      const resourceData = insertResourceSchema.parse(req.body);
      const resource = await storage.createResource(resourceData);
      return res.status(201).json(resource);
    } catch (error) {
      return res.status(400).json({ message: "Invalid resource data", error });
    }
  });
  
  // Update resource
  apiRouter.patch("/resources/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid resource ID" });
    }
    
    try {
      const updateSchema = insertResourceSchema.partial();
      const updateData = updateSchema.parse(req.body);
      
      const resource = await storage.updateResource(id, updateData);
      if (!resource) {
        return res.status(404).json({ message: "Resource not found" });
      }
      
      return res.json(resource);
    } catch (error) {
      return res.status(400).json({ message: "Invalid update data", error });
    }
  });
  
  // Resource logs
  apiRouter.get("/resources/:id/logs", async (req: Request, res: Response) => {
    const resourceId = parseInt(req.params.id);
    if (isNaN(resourceId)) {
      return res.status(400).json({ message: "Invalid resource ID" });
    }
    
    // Parse date strings to Date objects for filtering
    let startDate: Date | undefined = undefined;
    let endDate: Date | undefined = undefined;
    
    if (req.query.startDate) {
      try {
        startDate = new Date(req.query.startDate as string);
      } catch (e) {
        return res.status(400).json({ message: "Invalid start date format" });
      }
    }
    
    if (req.query.endDate) {
      try {
        endDate = new Date(req.query.endDate as string);
      } catch (e) {
        return res.status(400).json({ message: "Invalid end date format" });
      }
    }
    
    const actionType = req.query.actionType as string | undefined;
    const region = req.query.region as string | undefined;
    
    try {
      const logs = await storage.getResourceLogs(resourceId, {
        startDate,
        endDate,
        actionType,
        region
      });
      
      return res.json(logs);
    } catch (error) {
      console.error(`Error fetching resource logs:`, error);
      return res.status(500).json({ message: "Failed to fetch resource logs" });
    }
  });
  
  apiRouter.post("/resources/:id/logs", async (req: Request, res: Response) => {
    const resourceId = parseInt(req.params.id);
    if (isNaN(resourceId)) {
      return res.status(400).json({ message: "Invalid resource ID" });
    }
    
    try {
      // Pre-process the timestamp if it exists as a string
      const requestData = { ...req.body, resourceId };
      if (typeof requestData.timestamp === 'string') {
        requestData.timestamp = new Date(requestData.timestamp);
      }
      
      const logData = insertResourceLogSchema.parse(requestData);
      
      const log = await storage.createResourceLog(logData);
      return res.status(201).json(log);
    } catch (error) {
      console.error(`Error creating resource log:`, error);
      return res.status(400).json({ message: "Invalid resource log data", error });
    }
  });
  
  // Resource actions
  apiRouter.post("/resources/:id/isolate", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid resource ID" });
    }
    
    const resource = await storage.updateResource(id, { isolated: true });
    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }
    
    return res.json(resource);
  });
  
  apiRouter.post("/resources/:id/forensic-copy", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid resource ID" });
    }
    
    const resource = await storage.updateResource(id, { forensicCopy: true });
    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }
    
    return res.json(resource);
  });
  
  apiRouter.post("/resources/:id/destroy", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid resource ID" });
    }
    
    const resource = await storage.updateResource(id, { 
      status: "Destroyed",
      isolated: true // When we destroy, we also isolate it
    });
    
    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }
    
    return res.json(resource);
  });
  
  // Get timeline events for an incident
  apiRouter.get("/incidents/:incidentId/timeline", async (req: Request, res: Response) => {
    const incidentId = parseInt(req.params.incidentId);
    if (isNaN(incidentId)) {
      return res.status(400).json({ message: "Invalid incident ID" });
    }
    
    const timelineEvents = await storage.getTimelineEvents(incidentId);
    return res.json(timelineEvents);
  });
  
  // Add timeline event
  apiRouter.post("/timeline", async (req: Request, res: Response) => {
    try {
      const eventData = insertTimelineEventSchema.parse(req.body);
      const event = await storage.createTimelineEvent(eventData);
      return res.status(201).json(event);
    } catch (error) {
      return res.status(400).json({ message: "Invalid event data", error });
    }
  });
  
  // AI-powered incident severity prediction
  apiRouter.post("/incidents/predict-severity", async (req: Request, res: Response) => {
    try {
      // Use a partial schema to allow incomplete incident data for analysis
      const incidentDataSchema = insertIncidentSchema.partial();
      const incidentData = incidentDataSchema.parse(req.body);
      
      // Predict severity using AI or fallback
      const prediction = await predictIncidentSeverity(incidentData);
      return res.json(prediction);
    } catch (error) {
      console.error("Error predicting incident severity:", error);
      return res.status(400).json({ 
        message: "Error predicting incident severity", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  // Get severity prediction for an existing incident
  apiRouter.get("/incidents/:id/predict-severity", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid incident ID" });
    }
    
    const incident = await storage.getIncident(id);
    if (!incident) {
      return res.status(404).json({ message: "Incident not found" });
    }
    
    try {
      // Predict severity using AI or fallback
      const prediction = await predictIncidentSeverity(incident);
      return res.json(prediction);
    } catch (error) {
      console.error("Error predicting incident severity:", error);
      return res.status(400).json({ 
        message: "Error predicting incident severity", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  // Cloud Account Routes
  
  // Get all cloud accounts with optional filters
  apiRouter.get("/cloud-accounts", async (req: Request, res: Response) => {
    const provider = req.query.provider as string | undefined;
    const status = req.query.status as string | undefined;
    
    const accounts = await storage.getCloudAccounts({
      provider,
      status
    });
    
    return res.json(accounts);
  });

  // Get single cloud account by ID
  apiRouter.get("/cloud-accounts/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid cloud account ID" });
    }
    
    const account = await storage.getCloudAccount(id);
    if (!account) {
      return res.status(404).json({ message: "Cloud account not found" });
    }
    
    return res.json(account);
  });
  
  // Create cloud account
  apiRouter.post("/cloud-accounts", async (req: Request, res: Response) => {
    try {
      const accountData = insertCloudAccountSchema.parse(req.body);
      const account = await storage.createCloudAccount(accountData);
      return res.status(201).json(account);
    } catch (error) {
      return res.status(400).json({ message: "Invalid cloud account data", error });
    }
  });
  
  // Update cloud account
  apiRouter.patch("/cloud-accounts/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid cloud account ID" });
    }
    
    try {
      const updateSchema = insertCloudAccountSchema.partial();
      const updateData = updateSchema.parse(req.body);
      
      const account = await storage.updateCloudAccount(id, updateData);
      if (!account) {
        return res.status(404).json({ message: "Cloud account not found" });
      }
      
      return res.json(account);
    } catch (error) {
      return res.status(400).json({ message: "Invalid update data", error });
    }
  });

  // Compliance Management Routes
  
  // Compliance Standard routes
  apiRouter.get("/compliance/standards", async (req: Request, res: Response) => {
    try {
      const enabled = req.query.enabled === 'true' ? true : 
                    req.query.enabled === 'false' ? false : undefined;
      const standards = await storage.getComplianceStandards(enabled);
      res.json(standards);
    } catch (error) {
      console.error(`Error fetching compliance standards:`, error);
      res.status(500).json({ message: "Failed to fetch compliance standards" });
    }
  });

  apiRouter.get("/compliance/standards/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid standard ID" });
      }
      
      const standard = await storage.getComplianceStandard(id);
      if (!standard) {
        return res.status(404).json({ message: "Compliance standard not found" });
      }
      res.json(standard);
    } catch (error) {
      console.error(`Error fetching compliance standard:`, error);
      res.status(500).json({ message: "Failed to fetch compliance standard" });
    }
  });

  // Compliance Rule routes
  apiRouter.get("/compliance/rules", async (req: Request, res: Response) => {
    try {
      const filters: {
        standardId?: number;
        severity?: string;
        enabled?: boolean;
        action?: string;
        provider?: string;
      } = {};

      if (req.query.standardId) {
        filters.standardId = parseInt(req.query.standardId as string);
      }

      if (req.query.severity) {
        filters.severity = req.query.severity as string;
      }

      if (req.query.enabled !== undefined) {
        filters.enabled = req.query.enabled === 'true';
      }

      if (req.query.action) {
        filters.action = req.query.action as string;
      }

      if (req.query.provider) {
        filters.provider = req.query.provider as string;
      }

      const rules = await storage.getComplianceRules(filters);
      res.json(rules);
    } catch (error) {
      console.error(`Error fetching compliance rules:`, error);
      res.status(500).json({ message: "Failed to fetch compliance rules" });
    }
  });

  apiRouter.get("/compliance/rules/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid rule ID" });
      }
      
      const rule = await storage.getComplianceRule(id);
      if (!rule) {
        return res.status(404).json({ message: "Compliance rule not found" });
      }
      res.json(rule);
    } catch (error) {
      console.error(`Error fetching compliance rule:`, error);
      res.status(500).json({ message: "Failed to fetch compliance rule" });
    }
  });

  // Non-compliant resources
  apiRouter.get("/compliance/non-compliant-resources", async (req: Request, res: Response) => {
    try {
      const accountId = req.query.accountId ? parseInt(req.query.accountId as string) : undefined;
      const standardId = req.query.standardId ? parseInt(req.query.standardId as string) : undefined;
      
      const nonCompliantResources = await storage.getNonCompliantResources(accountId, standardId);
      res.json(nonCompliantResources);
    } catch (error) {
      console.error(`Error fetching non-compliant resources:`, error);
      res.status(500).json({ message: "Failed to fetch non-compliant resources" });
    }
  });

  // Grant exemption for a resource-rule combination
  apiRouter.post("/compliance/exemptions", async (req: Request, res: Response) => {
    try {
      const { resourceId, ruleId, reason, expiryDate, exemptedBy } = req.body;
      
      if (!resourceId || !ruleId || !reason || !exemptedBy) {
        return res.status(400).json({ 
          message: "Missing required fields. Please provide resourceId, ruleId, reason, and exemptedBy." 
        });
      }
      
      const exemption = await storage.grantExemption(
        parseInt(resourceId), 
        parseInt(ruleId), 
        {
          reason,
          expiryDate: expiryDate ? new Date(expiryDate) : undefined,
          exemptedBy: parseInt(exemptedBy)
        }
      );
      
      if (!exemption) {
        return res.status(404).json({ 
          message: "Could not grant exemption. Either the resource or rule does not exist, or there is no compliance record for this combination." 
        });
      }
      
      res.json(exemption);
    } catch (error) {
      console.error(`Error granting exemption:`, error);
      res.status(500).json({ message: "Failed to grant exemption" });
    }
  });

  // Calculate compliance for an account and standard
  apiRouter.get("/compliance/accounts/:accountId/standards/:standardId", async (req: Request, res: Response) => {
    try {
      const accountId = parseInt(req.params.accountId);
      const standardId = parseInt(req.params.standardId);
      
      if (isNaN(accountId) || isNaN(standardId)) {
        return res.status(400).json({ message: "Invalid account ID or standard ID" });
      }
      
      const account = await storage.getCloudAccount(accountId);
      if (!account) {
        return res.status(404).json({ message: "Cloud account not found" });
      }
      
      const standard = await storage.getComplianceStandard(standardId);
      if (!standard) {
        return res.status(404).json({ message: "Compliance standard not found" });
      }
      
      const compliance = await storage.calculateAccountCompliance(accountId, standardId);
      res.json(compliance);
    } catch (error) {
      console.error(`Error calculating account compliance:`, error);
      res.status(500).json({ message: "Failed to calculate account compliance" });
    }
  });
  
  // CISO Dashboard APIs
  
  // Get compliance summary for CISO dashboard
  apiRouter.get("/compliance/summary", async (req: Request, res: Response) => {
    try {
      // Get total counts of compliant and non-compliant resources
      const allRules = await storage.getComplianceRules();
      const allResources = await storage.getResources();
      const allAccounts = await storage.getCloudAccounts();
      const allStandards = await storage.getComplianceStandards();
      
      // Calculate non-compliant resources by provider
      const nonCompliantByProvider: Record<string, number> = {
        aws: 0,
        azure: 0,
        gcp: 0
      };
      
      // Calculate non-compliant resources by severity
      const nonCompliantBySeverity: Record<string, number> = {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0
      };
      
      // Calculate auto-enforced rules
      const enforceRules = allRules.filter(rule => rule.action === "enforce");
      const enforceRulesByStandard: Record<string, number> = {};
      allStandards.forEach(standard => {
        enforceRulesByStandard[standard.name] = enforceRules.filter(rule => rule.standardId === standard.id).length;
      });
      
      // Get all non-compliant resource records
      const resourceComplianceRecords = await db.select().from(resourceCompliance).where(
        and(
          ne(resourceCompliance.status, "compliant"),
          ne(resourceCompliance.status, "not_applicable"),
          ne(resourceCompliance.status, "exempted")
        )
      );
      
      // Count resources by provider (based on the resources)
      const resourcesByProvider = allResources.reduce((acc, resource) => {
        // Check if the resource is non-compliant
        const isNonCompliant = resourceComplianceRecords.some(
          record => record.resourceId === resource.id
        );
        
        if (isNonCompliant) {
          // Determine provider based on metadata or other fields
          let provider = "aws"; // Default
          if (resource.metadata && typeof resource.metadata === 'object' && 'provider' in resource.metadata) {
            provider = (resource.metadata.provider as string).toLowerCase();
          } else if (resource.resourceId.includes('azure')) {
            provider = "azure";
          } else if (resource.resourceId.includes('gcp')) {
            provider = "gcp";
          }
          
          if (nonCompliantByProvider[provider] !== undefined) {
            nonCompliantByProvider[provider]++;
          }
        }
        
        return acc;
      }, nonCompliantByProvider);
      
      // Count non-compliant resources by severity of the rule
      for (const record of resourceComplianceRecords) {
        const rule = allRules.find(r => r.id === record.ruleId);
        if (rule && nonCompliantBySeverity[rule.severity] !== undefined) {
          nonCompliantBySeverity[rule.severity]++;
        }
      }
      
      // Get enforcement coverage by account
      const accountEnforcement: Array<{
        accountId: string;
        accountName: string;
        provider: string;
        enforceRulesCount: number;
        totalRulesCount: number;
        enforcementPercentage: number;
      }> = [];
      
      for (const account of allAccounts) {
        // For this account, count the rules that are set to enforce
        const applicableRules = allRules.filter(rule => {
          if (!rule.providers || rule.providers.length === 0) return true;
          return rule.providers.includes(account.provider);
        });
        
        const enforceRulesForAccount = applicableRules.filter(rule => rule.action === "enforce");
        
        accountEnforcement.push({
          accountId: account.accountId,
          accountName: account.name,
          provider: account.provider,
          enforceRulesCount: enforceRulesForAccount.length,
          totalRulesCount: applicableRules.length,
          enforcementPercentage: applicableRules.length > 0 
            ? (enforceRulesForAccount.length / applicableRules.length) * 100 
            : 0
        });
      }
      
      // Calculate total compliance metrics
      const totalResources = allResources.length;
      const totalNonCompliantResources = new Set(
        resourceComplianceRecords.map(record => record.resourceId)
      ).size;
      
      const response = {
        totalResources,
        compliantResources: totalResources - totalNonCompliantResources,
        nonCompliantResources: totalNonCompliantResources,
        compliancePercentage: totalResources > 0 
          ? ((totalResources - totalNonCompliantResources) / totalResources) * 100 
          : 100,
        nonCompliantByProvider,
        nonCompliantBySeverity,
        enforceRulesByStandard,
        accountEnforcement,
        totalEnforceRules: enforceRules.length,
        totalRules: allRules.length
      };
      
      return res.json(response);
    } catch (error) {
      console.error("Error fetching compliance summary:", error);
      return res.status(500).json({ message: "Failed to fetch compliance summary" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
