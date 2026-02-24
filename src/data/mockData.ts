import { GateOrder, LoadEvent, Conference, Route, KPI, Incident, ClosingReport, Driver, Vehicle, Agency } from "@/types/domain";

// Mock drivers
export const mockDrivers: Driver[] = [
  { id: "d1", name: "Carlos Silva", document: "123.456.789-00", phone: "(14) 99123-4567", carrier_name: "Rápido Express", training_status: "ok" },
  { id: "d2", name: "João Oliveira", document: "987.654.321-00", phone: "(14) 99234-5678", carrier_name: "TransLog", training_status: "pending" },
  { id: "d3", name: "Maria Santos", document: "456.789.123-00", phone: "(14) 99345-6789", carrier_name: "Rápido Express", training_status: "ok" },
  { id: "d4", name: "Pedro Costa", document: "321.654.987-00", phone: "(14) 99456-7890", carrier_name: "VeloCity", training_status: "ok" },
  { id: "d5", name: "Ana Ferreira", document: "654.987.321-00", phone: "(14) 99567-8901", carrier_name: "TransLog", training_status: "pending" },
];

export const mockVehicles: Vehicle[] = [
  { id: "v1", plate: "ABC-1234", type: "truck", carrier_name: "Rápido Express", notes: "" },
  { id: "v2", plate: "DEF-5678", type: "truck", carrier_name: "TransLog", notes: "" },
  { id: "v3", plate: "GHI-9012", type: "car", carrier_name: "VeloCity", notes: "" },
  { id: "v4", plate: "JKL-3456", type: "moto", carrier_name: "Rápido Express", notes: "" },
  { id: "v5", plate: "MNO-7890", type: "truck", carrier_name: "TransLog", notes: "Refrigerated" },
];

export const mockAgencies: Agency[] = [
  { id: "a1", name: "Marília Central", city: "Marília", uf: "SP" },
  { id: "a2", name: "Bauru Hub", city: "Bauru", uf: "SP" },
  { id: "a3", name: "Assis Operações", city: "Assis", uf: "SP" },
  { id: "a4", name: "Ourinhos Centro", city: "Ourinhos", uf: "SP" },
];

export const mockGateOrders: GateOrder[] = [
  { id: "go1", date: "2026-02-24", list_number: 1, plate: "ABC-1234", driver_id: "d1", route_id: "r1", dock: "D1", status: "loading", released_at: "07:15", dock_in_at: "07:22", loading_start_at: "07:30", loading_end_at: null, created_by: "admin" },
  { id: "go2", date: "2026-02-24", list_number: 1, plate: "DEF-5678", driver_id: "d2", route_id: "r2", dock: "D2", status: "at_dock", released_at: "07:20", dock_in_at: "07:28", loading_start_at: null, loading_end_at: null, created_by: "admin" },
  { id: "go3", date: "2026-02-24", list_number: 1, plate: "GHI-9012", driver_id: "d3", route_id: "r3", dock: null, status: "released", released_at: "07:35", dock_in_at: null, loading_start_at: null, loading_end_at: null, created_by: "admin" },
  { id: "go4", date: "2026-02-24", list_number: 1, plate: "JKL-3456", driver_id: "d4", route_id: "r4", dock: null, status: "waiting", released_at: null, dock_in_at: null, loading_start_at: null, loading_end_at: null, created_by: "admin" },
  { id: "go5", date: "2026-02-24", list_number: 2, plate: "MNO-7890", driver_id: "d5", route_id: "r5", dock: "D3", status: "finished", released_at: "06:30", dock_in_at: "06:38", loading_start_at: "06:45", loading_end_at: "07:40", created_by: "admin" },
];

export const mockRoutes: Route[] = [
  { id: "r1", date: "2026-02-24", agency_id: "a1", route_code: "MAR-001", vehicle_type: "truck", planned_stops: 45, planned_minutes: 480, planned_distance_km: 120, actual_stops: 38, actual_minutes: 420, status: "in_progress", notes: "" },
  { id: "r2", date: "2026-02-24", agency_id: "a2", route_code: "BAU-015", vehicle_type: "truck", planned_stops: 60, planned_minutes: 540, planned_distance_km: 180, actual_stops: null, actual_minutes: null, status: "planned", notes: "" },
  { id: "r3", date: "2026-02-24", agency_id: "a1", route_code: "MAR-003", vehicle_type: "car", planned_stops: 25, planned_minutes: 300, planned_distance_km: 80, actual_stops: 25, actual_minutes: 310, status: "done", notes: "All deliveries completed" },
  { id: "r4", date: "2026-02-24", agency_id: "a3", route_code: "ASS-007", vehicle_type: "moto", planned_stops: 30, planned_minutes: 360, planned_distance_km: 65, actual_stops: 22, actual_minutes: 280, status: "in_progress", notes: "Driver reported traffic" },
  { id: "r5", date: "2026-02-24", agency_id: "a4", route_code: "OUR-012", vehicle_type: "truck", planned_stops: 50, planned_minutes: 500, planned_distance_km: 150, actual_stops: 50, actual_minutes: 510, status: "done", notes: "" },
];

export const mockConferences: Conference[] = [
  { id: "c1", date: "2026-02-24", agency_id: "a1", route_id: "r1", qty_sacks: 120, qty_cotas: 45, orders_sys_a: 312, orders_sys_b: 312, is_divergent: false, divergence_reason: null, resolved_by: null, resolved_at: null, attachment_id: null },
  { id: "c2", date: "2026-02-24", agency_id: "a2", route_id: "r2", qty_sacks: 85, qty_cotas: 30, orders_sys_a: 245, orders_sys_b: 241, is_divergent: true, divergence_reason: "4 orders missing in Sys B - pending recount", resolved_by: null, resolved_at: null, attachment_id: null },
  { id: "c3", date: "2026-02-24", agency_id: "a1", route_id: "r3", qty_sacks: 60, qty_cotas: 20, orders_sys_a: 180, orders_sys_b: 180, is_divergent: false, divergence_reason: null, resolved_by: null, resolved_at: null, attachment_id: null },
];

export const mockKPIs: KPI[] = [
  { id: "k1", date: "2026-02-24", carrier_name: "Rápido Express", driver_id: "d1", kpi_type: "performance", metric_name: "Entregas/hora", metric_value: 8.5, unit: "un/h", source: "manual", notes: "" },
  { id: "k2", date: "2026-02-24", carrier_name: "TransLog", driver_id: "d2", kpi_type: "safety", metric_name: "Excesso velocidade", metric_value: 3, unit: "eventos", source: "import", notes: "Above threshold" },
  { id: "k3", date: "2026-02-24", carrier_name: "Rápido Express", driver_id: "d1", kpi_type: "telematics", metric_name: "Frenagem brusca", metric_value: 1, unit: "eventos", source: "import", notes: "" },
  { id: "k4", date: "2026-02-24", carrier_name: "VeloCity", driver_id: "d4", kpi_type: "training", metric_name: "Treinamento pendente", metric_value: 1, unit: "bool", source: "manual", notes: "Safety refresher needed" },
];

export const mockIncidents: Incident[] = [
  { id: "i1", date: "2026-02-24", incident_type: "fire_drill", duration_min: 40, impact: "All operations paused for 40 min", notes: "Scheduled fire drill" },
  { id: "i2", date: "2026-02-24", incident_type: "late_truck", duration_min: 90, impact: "Route BAU-015 delayed", notes: "Carrier TransLog truck DEF-5678 arrived 1.5h late" },
];

export const mockClosingReport: ClosingReport = {
  id: "cr1", date: "2026-02-24", packages_out: 1245, packages_in_base: 38, summary_text: "", generated_by_ai: false, created_by: "admin"
};

export function getDriverName(id: string): string {
  return mockDrivers.find(d => d.id === id)?.name ?? "Unknown";
}

export function getAgencyName(id: string): string {
  return mockAgencies.find(a => a.id === id)?.name ?? "Unknown";
}
