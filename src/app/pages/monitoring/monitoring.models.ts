// ── Monitoring Models ────────────────────────────────────────────

export interface RouterStatus {
  id: number;
  name: string;
  ip: string;
  vendor: string;
  model: string;
  reachable: boolean;
  response_ms: number | null;
  status: 'up' | 'down';
  checked_at: string;
}

export interface NetworkHealth {
  routers: RouterStatus[];
  total: number;
  reachable: number;
  unreachable: number;
  health_pct: number;
  cached_at: string;
  cache_ttl_secs: number;
}

export interface DailyPoint {
  date: string;
  total: number;
  completed: number;
  failed: number;
}

export interface RunningTask {
  id: number;
  device_name: string;
  device_ip: string;
  task_type: string;
  status: string;
  created_at: string;
  elapsed_secs: number;
}

export interface ProvisioningStats {
  today: {
    total: number;
    completed: number;
    failed: number;
    running: number;
    success_rate: number;
  };
  running_tasks: RunningTask[];
  recent_done: any[];
  daily_sparkline: DailyPoint[];
  avg_exec_secs: number;
}

export interface AiStats {
  validations_today: {
    total: number;
    safe: number;
    warning: number;
    blocked: number;
  };
  rca: {
    open: number;
    recent: any[];
    top_cause: string | null;
    top_cause_count: number;
  };
  daily_sparkline: any[];
}

export interface PortStats {
  summary: {
    total: number;
    active: number;
    inactive: number;
    pending: number;
    stuck: number;
    active_pct: number;
  };
  stuck_ports: any[];
  vendor_breakdown: any[];
}

export interface MonitoringSummary {
  network: NetworkHealth;
  provisioning: ProvisioningStats;
  ai: AiStats;
  ports: PortStats;
  generated_at: string;
}

export interface PathHop {
  from: string;
  to: string;
  cost: number;
  capacity: string;
}

export interface IsisPathResponse {
  status: string;
  route: string[];
  path_details: PathHop[];
  total_cost: number;
  distance_hops: number;
}
