// ── AI Engine — Shared Type Definitions ──────────────────────────────────────

export interface AccessRequest {
  id: number;
  username: string;
  email: string;
  status: 'none' | 'pending' | 'approved' | 'refused';
  reason: string;
  admin_note: string;
  requested_at: string;
  reviewed_at: string | null;
  reviewed_by_username: string | null;
}

export interface PreExecCheck {
  name: string;
  status: 'ok' | 'warn' | 'fail';
  detail: string;
}

export interface ValidationResult {
  id: number;
  task_id: number;
  task_type: 'voip' | 'internet';
  router_hostname: string;
  vendor: 'huawei' | 'juniper';
  success_probability: number;   // 0.0–1.0
  verdict: 'safe' | 'warning' | 'blocked';
  verdict_display: string;
  feature_scores: Record<string, number>;
  pre_exec_checks: PreExecCheck[];
  model_version: string;
  evaluated_at: string;
}

export interface TimelineStep {
  step: string;
  status: 'ok' | 'warn' | 'fail';
  detail: string;
  ts: string;
}

export interface RootCauseAnalysis {
  id: number;
  task_id: number;
  task_type: string;
  router_hostname: string;
  vendor: string;
  error_message: string;
  classified_cause: string;
  cause_display: string;
  confidence: number;
  suggested_fixes: string[];
  timeline: TimelineStep[];
  similar_task_ids: number[];
  is_resolved: boolean;
  resolved_at: string | null;
  resolution_note: string;
  created_at: string;
}

export interface ValidatorStats {
  date: string;
  tasks_validated: number;
  failures_prevented: number;
  model_accuracy: number;
  avg_rca_seconds: number;
}
