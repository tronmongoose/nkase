import { 
  users, type User, type InsertUser,
  incidents, type Incident, type InsertIncident,
  resources, type Resource, type InsertResource,
  timelineEvents, type TimelineEvent, type InsertTimelineEvent
} from "@shared/schema";

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

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private incidents: Map<number, Incident>;
  private resources: Map<number, Resource>;
  private timelineEvents: Map<number, TimelineEvent>;
  
  private userIdCounter: number;
  private incidentIdCounter: number;
  private resourceIdCounter: number;
  private timelineEventIdCounter: number;
  
  constructor() {
    this.users = new Map();
    this.incidents = new Map();
    this.resources = new Map();
    this.timelineEvents = new Map();
    
    this.userIdCounter = 1;
    this.incidentIdCounter = 1;
    this.resourceIdCounter = 1;
    this.timelineEventIdCounter = 1;
    
    // Initialize with seed data
    this.seedData();
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Incident operations
  async getIncident(id: number): Promise<Incident | undefined> {
    return this.incidents.get(id);
  }
  
  async getIncidentById(incidentId: string): Promise<Incident | undefined> {
    return Array.from(this.incidents.values()).find(
      (incident) => incident.incidentId === incidentId
    );
  }
  
  async getIncidents(filters?: {
    severity?: string;
    status?: string;
    timeframe?: string;
  }): Promise<Incident[]> {
    let incidents = Array.from(this.incidents.values());
    
    if (filters) {
      if (filters.severity && filters.severity !== 'All severities') {
        incidents = incidents.filter(incident => incident.severity.toLowerCase() === filters.severity?.toLowerCase());
      }
      
      if (filters.status && filters.status !== 'all') {
        incidents = incidents.filter(incident => incident.status.toLowerCase() === filters.status?.toLowerCase());
      }
      
      if (filters.timeframe) {
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
          // 'All time' - no filtering
        }
        
        if (filters.timeframe !== 'All time') {
          incidents = incidents.filter(incident => new Date(incident.detectedAt) >= cutoff);
        }
      }
    }
    
    // Sort by detected time, most recent first
    return incidents.sort((a, b) => 
      new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime()
    );
  }
  
  async createIncident(insertIncident: InsertIncident): Promise<Incident> {
    const id = this.incidentIdCounter++;
    const incident: Incident = { ...insertIncident, id };
    this.incidents.set(id, incident);
    return incident;
  }
  
  async updateIncident(id: number, incidentUpdate: Partial<InsertIncident>): Promise<Incident | undefined> {
    const incident = this.incidents.get(id);
    if (!incident) return undefined;
    
    const updatedIncident = { ...incident, ...incidentUpdate, updatedAt: new Date() };
    this.incidents.set(id, updatedIncident);
    return updatedIncident;
  }
  
  // Resource operations
  async getResource(id: number): Promise<Resource | undefined> {
    return this.resources.get(id);
  }
  
  async getResourceById(resourceId: string): Promise<Resource | undefined> {
    return Array.from(this.resources.values()).find(
      (resource) => resource.resourceId === resourceId
    );
  }
  
  async getResources(filters?: {
    resourceType?: string;
    region?: string;
    status?: string;
  }): Promise<Resource[]> {
    let resources = Array.from(this.resources.values());
    
    if (filters) {
      if (filters.resourceType && filters.resourceType !== 'All resources') {
        resources = resources.filter(resource => resource.resourceType === filters.resourceType);
      }
      
      if (filters.region && filters.region !== 'All regions') {
        resources = resources.filter(resource => resource.region === filters.region);
      }
      
      if (filters.status) {
        resources = resources.filter(resource => resource.status.toLowerCase().includes(filters.status!.toLowerCase()));
      }
    }
    
    // Sort by discovered time, most recent first
    return resources.sort((a, b) => 
      new Date(b.discoveredAt).getTime() - new Date(a.discoveredAt).getTime()
    );
  }
  
  async createResource(insertResource: InsertResource): Promise<Resource> {
    const id = this.resourceIdCounter++;
    const resource: Resource = { ...insertResource, id };
    this.resources.set(id, resource);
    return resource;
  }
  
  async updateResource(id: number, resourceUpdate: Partial<InsertResource>): Promise<Resource | undefined> {
    const resource = this.resources.get(id);
    if (!resource) return undefined;
    
    const updatedResource = { ...resource, ...resourceUpdate };
    this.resources.set(id, updatedResource);
    return updatedResource;
  }
  
  // Timeline operations
  async getTimelineEvents(incidentId: number): Promise<TimelineEvent[]> {
    const events = Array.from(this.timelineEvents.values())
      .filter(event => event.incidentId === incidentId);
    
    // Sort by timestamp
    return events.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }
  
  async createTimelineEvent(insertEvent: InsertTimelineEvent): Promise<TimelineEvent> {
    const id = this.timelineEventIdCounter++;
    const event: TimelineEvent = { ...insertEvent, id };
    this.timelineEvents.set(id, event);
    return event;
  }
  
  // Seed with initial demo data
  private seedData() {
    // Create default user
    const user: InsertUser = {
      username: "alexmorgan",
      password: "securepassword", // In a real app, this would be hashed
      fullName: "Alex Morgan",
      role: "incident_responder",
      avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
    };
    this.createUser(user);
    
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
    this.createResource(ec2Resource);
    
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
    this.createResource(s3Resource);
    
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
    this.createResource(iamResource);
    
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
    this.createResource(lambdaResource);
    
    // Create sample incidents
    const incident1: InsertIncident = {
      title: "Unauthorized API Access",
      description: "Abnormal activity detected on EC2 instance i-09a8d67b5e4c3f21d in us-east-1 region. Unauthorized API calls were made using the instance profile credentials. Network traffic analysis shows potential data exfiltration to unknown external IP.",
      severity: "critical",
      status: "active",
      detectedAt: new Date(Date.now() - 10 * 60 * 1000), // 10 min ago
      affectedResources: ["i-09a8d67b5e4c3f21d", "vpc-89a7f3c1"],
      assignedTo: 1, // Alex Morgan
      incidentId: "INC-20230715-0053"
    };
    this.createIncident(incident1);
    
    const incident2: InsertIncident = {
      title: "S3 Bucket Data Exfiltration",
      description: "Unusual access patterns detected on customer data bucket. Large volume of GetObject requests from unfamiliar IP addresses. Potential customer data breach.",
      severity: "critical",
      status: "active",
      detectedAt: new Date(Date.now() - 45 * 60 * 1000), // 45 min ago
      affectedResources: ["customer-data-prod-e7fb9"],
      assignedTo: 1, // Alex Morgan
      incidentId: "INC-20230715-0052"
    };
    this.createIncident(incident2);
    
    const incident3: InsertIncident = {
      title: "IAM Privilege Escalation",
      description: "Jenkins role has been modified to gain admin privileges. Suspicious policy attachments detected.",
      severity: "high",
      status: "active",
      detectedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      affectedResources: ["developer-jenkins-role"],
      assignedTo: 1, // Alex Morgan
      incidentId: "INC-20230715-0051"
    };
    this.createIncident(incident3);
    
    // Create timeline events for first incident
    const timeline1: InsertTimelineEvent = {
      incidentId: 1,
      timestamp: new Date(Date.now() - (10 * 60 * 1000)),
      eventType: "initial_access",
      description: "Suspicious login detected from IP 203.0.113.42 (Geo: Russia) using compromised credentials.",
      severity: "critical"
    };
    this.createTimelineEvent(timeline1);
    
    const timeline2: InsertTimelineEvent = {
      incidentId: 1,
      timestamp: new Date(Date.now() - (9 * 60 * 1000) - 15000),
      eventType: "privilege_escalation",
      description: "Attacker modified IAM role permissions to gain admin access to EC2 instance.",
      severity: "critical"
    };
    this.createTimelineEvent(timeline2);
    
    const timeline3: InsertTimelineEvent = {
      incidentId: 1,
      timestamp: new Date(Date.now() - (9 * 60 * 1000) - 30000),
      eventType: "lateral_movement",
      description: "Access to additional EC2 instances in the same VPC detected from compromised instance.",
      severity: "high"
    };
    this.createTimelineEvent(timeline3);
    
    const timeline4: InsertTimelineEvent = {
      incidentId: 1,
      timestamp: new Date(Date.now() - (8 * 60 * 1000)),
      eventType: "discovery",
      description: "Multiple DescribeInstances, ListBuckets API calls detected from compromised instance.",
      severity: "high"
    };
    this.createTimelineEvent(timeline4);
    
    const timeline5: InsertTimelineEvent = {
      incidentId: 1,
      timestamp: new Date(Date.now() - (7 * 60 * 1000)),
      eventType: "data_collection",
      description: "Unauthorized S3 GetObject calls to customer-data-prod-e7fb9 bucket detected.",
      severity: "critical"
    };
    this.createTimelineEvent(timeline5);
    
    const timeline6: InsertTimelineEvent = {
      incidentId: 1,
      timestamp: new Date(Date.now() - (6 * 60 * 1000)),
      eventType: "alert_triggered",
      description: "GuardDuty detected unusual API activity and triggered a security alert.",
      severity: "info"
    };
    this.createTimelineEvent(timeline6);
  }
}

export const storage = new MemStorage();
