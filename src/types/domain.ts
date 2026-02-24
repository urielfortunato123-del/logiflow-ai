export type UserRole = "admin" | "analyst" | "dock_operator" | "viewer";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
}

export interface Vehicle {
  id: string;
  plate: string;
  type: "car" | "moto" | "truck";
  carrier_name: string;
  notes: string;
}

export interface Driver {
  id: string;
  name: string;
  document: string;
  phone: string;
  carrier_name: string;
  training_status: "ok" | "pending";
}

export interface Agency {
  id: string;
  name: string;
  city: string;
  uf: string;
}

export type RouteStatus = "planned" | "in_progress" | "done";

export interface Route {
  id: string;
  date: string;
  agency_id: string;
  route_code: string;
  vehicle_type: string;
  planned_stops: number;
  planned_minutes: number;
  planned_distance_km: number;
  actual_stops: number | null;
  actual_minutes: number | null;
  status: RouteStatus;
  notes: string;
}

export type GateOrderStatus = "waiting" | "released" | "at_dock" | "loading" | "finished";

export interface GateOrder {
  id: string;
  date: string;
  list_number: number;
  plate: string;
  driver_id: string;
  route_id: string | null;
  dock: string | null;
  status: GateOrderStatus;
  released_at: string | null;
  dock_in_at: string | null;
  loading_start_at: string | null;
  loading_end_at: string | null;
  created_by: string;
}

export type LoadEventType = "dock_in" | "start" | "pause" | "resume" | "end";

export interface LoadEvent {
  id: string;
  gate_order_id: string;
  event_type: LoadEventType;
  ts: string;
  notes: string;
  created_by: string;
}

export interface Conference {
  id: string;
  date: string;
  agency_id: string;
  route_id: string;
  qty_sacks: number;
  qty_cotas: number;
  orders_sys_a: number;
  orders_sys_b: number;
  is_divergent: boolean;
  divergence_reason: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  attachment_id: string | null;
}

export type KPIType = "training" | "safety" | "telematics" | "performance";

export interface KPI {
  id: string;
  date: string;
  carrier_name: string;
  driver_id: string;
  kpi_type: KPIType;
  metric_name: string;
  metric_value: number;
  unit: string;
  source: "manual" | "import" | "ocr";
  notes: string;
}

export type IncidentType = "fire_drill" | "late_truck" | "system_outage" | "other";

export interface Incident {
  id: string;
  date: string;
  incident_type: IncidentType;
  duration_min: number;
  impact: string;
  notes: string;
}

export interface ClosingReport {
  id: string;
  date: string;
  packages_out: number;
  packages_in_base: number;
  summary_text: string;
  generated_by_ai: boolean;
  created_by: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
}
