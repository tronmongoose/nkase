import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertIncidentSchema, insertResourceSchema, insertTimelineEventSchema } from "@shared/schema";

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

  const httpServer = createServer(app);
  return httpServer;
}
