// User and authentication types
export interface User {
  id: number;
  username: string;
  fullName: string;
  role: UserRole;
  avatarUrl: string;
}

export type UserRole = "incident_responder" | "soc_analyst" | "incident_manager" | "ciso";

// Incident types
export interface Incident {
  id: number;
  title: string;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  detectedAt: string;
  updatedAt: string;
  affectedResources: string[];
  assignedTo: number;
  incidentId: string;
}

export type IncidentSeverity = "critical" | "high" | "medium" | "low";
export type IncidentStatus = "active" | "resolved" | "false_positive";

// Resource types
export interface Resource {
  id: number;
  resourceId: string;
  resourceType: ResourceType;
  name: string;
  region: string;
  status: string;
  metadata: Record<string, any>;
  isolated: boolean;
  forensicCopy: boolean;
  discoveredAt: string;
}

export type ResourceType = "EC2" | "S3" | "IAM" | "Lambda" | "VPC" | "RDS" | "DynamoDB" | "CloudTrail";

// Timeline event types
export interface TimelineEvent {
  id: number;
  incidentId: number;
  timestamp: string;
  eventType: EventType;
  description: string;
  severity: IncidentSeverity;
}

export type EventType = 
  | "initial_access"
  | "privilege_escalation"
  | "lateral_movement"
  | "discovery"
  | "data_collection"
  | "data_exfiltration"
  | "resource_modification"
  | "alert_triggered";

// Dashboard and filtering types
export interface IncidentFilters {
  severity?: string;
  status?: string;
  timeframe?: string;
}

export interface ResourceFilters {
  resourceType?: string;
  region?: string;
  status?: string;
}

// Reports and analytics types
export interface SecurityMetric {
  name: string;
  value: number;
  change?: number;
  trend?: "up" | "down" | "neutral";
}

export interface TimeSeriesDataPoint {
  date: string;
  value: number;
}

export interface SecurityReport {
  id: number;
  title: string;
  description: string;
  createdAt: string;
  createdBy: number;
  reportType: "incident_summary" | "vulnerability_assessment" | "compliance_audit";
  timeframe: {
    start: string;
    end: string;
  };
  data: any;
}
