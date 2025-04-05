import { formatDistance } from "date-fns";
import { AlertTriangle, Shield, Network, Search, Database, Bell } from "lucide-react";

interface TimelineEvent {
  id: number;
  incidentId: number;
  timestamp: string;
  eventType: string;
  description: string;
  severity: string;
}

interface TimelineProps {
  events: TimelineEvent[];
}

export const Timeline = ({ events }: TimelineProps) => {
  // Sort events by timestamp, oldest first
  const sortedEvents = [...events].sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  
  // Format time as HH:MM UTC
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC',
      hour12: false
    }) + ' UTC';
  };
  
  // Get icon based on event type
  const getEventIcon = (eventType: string, severity: string) => {
    const getColor = () => {
      switch (severity) {
        case 'critical':
          return 'bg-red-500';
        case 'high':
          return 'bg-yellow-500';
        case 'medium':
          return 'bg-orange-500';
        case 'low':
          return 'bg-blue-500';
        default:
          return 'bg-blue-500';
      }
    };
    
    return <div className={`timeline-bullet ${getColor()}`}></div>;
  };
  
  return (
    <div className="border-t border-slate-200 dark:border-slate-700 px-4 py-5 sm:px-6">
      <ul className="space-y-4">
        {sortedEvents.map((event) => (
          <li key={event.id} className="relative pl-6 timeline-item">
            {getEventIcon(event.eventType, event.severity)}
            <div className="flex justify-between">
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                {event.eventType.split('_').map(word => 
                  word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ')}
              </p>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {formatTime(event.timestamp)}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {event.description}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
};
