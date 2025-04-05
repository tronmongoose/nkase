import { 
  users, type User, type InsertUser,
  incidents, type Incident, type InsertIncident,
  resources, type Resource, type InsertResource,
  timelineEvents, type TimelineEvent, type InsertTimelineEvent
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, gt, like } from "drizzle-orm";

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
    const result = await query.orderBy(desc(incidents.detectedAt));
    return result;
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
    const result = await query.orderBy(desc(resources.discoveredAt));
    return result;
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
      
      console.log("Database seeding completed successfully.");
    }
  }
}

// Export an instance of DatabaseStorage
export const storage = new DatabaseStorage();
