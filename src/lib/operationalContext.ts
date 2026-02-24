import { getStore, STORE_KEYS } from "@/lib/localStorage";
import {
  mockGateOrders, mockDrivers, mockVehicles, mockAgencies,
  mockRoutes, mockConferences, mockKPIs, mockIncidents, mockClosingReport,
  getDriverName, getAgencyName,
} from "@/data/mockData";
import type { GateOrder, Route, Conference, KPI, Incident, ClosingReport } from "@/types/domain";

export function gatherOperationalContext() {
  const gateOrders = getStore<GateOrder>(STORE_KEYS.GATE_ORDERS, mockGateOrders);
  const routes = getStore<Route>(STORE_KEYS.ROUTES, mockRoutes);
  const conferences = getStore<Conference>(STORE_KEYS.CONFERENCES, mockConferences);
  const kpis = getStore<KPI>(STORE_KEYS.KPIS, mockKPIs);
  const incidents = getStore<Incident>(STORE_KEYS.INCIDENTS, mockIncidents);
  const closingReports = getStore<ClosingReport>(STORE_KEYS.CLOSING_REPORTS, [mockClosingReport]);

  const byStatus = (items: GateOrder[]) => {
    const counts: Record<string, number> = {};
    items.forEach(o => { counts[o.status] = (counts[o.status] || 0) + 1; });
    return counts;
  };

  return {
    date: new Date().toISOString().split("T")[0],
    dashboard_snapshot: {
      vehicles_in_queue: gateOrders.filter(o => o.status === "waiting").length,
      loading_now: gateOrders.filter(o => o.status === "loading").length,
      at_dock: gateOrders.filter(o => o.status === "at_dock").length,
      finished: gateOrders.filter(o => o.status === "finished").length,
      total_gate_orders: gateOrders.length,
      divergences: conferences.filter(c => c.is_divergent).length,
      total_conferences: conferences.length,
      routes_total: routes.length,
      routes_planned: routes.filter(r => r.status === "planned").length,
      routes_in_progress: routes.filter(r => r.status === "in_progress").length,
      routes_done: routes.filter(r => r.status === "done").length,
      total_kpis: kpis.length,
      total_incidents: incidents.length,
    },
    gate_orders: gateOrders.map(o => ({
      plate: o.plate,
      driver: getDriverName(o.driver_id),
      dock: o.dock,
      status: o.status,
      released_at: o.released_at,
      loading_start_at: o.loading_start_at,
      loading_end_at: o.loading_end_at,
    })),
    routes: routes.map(r => ({
      code: r.route_code,
      agency: getAgencyName(r.agency_id),
      status: r.status,
      planned_stops: r.planned_stops,
      actual_stops: r.actual_stops,
      planned_minutes: r.planned_minutes,
      actual_minutes: r.actual_minutes,
      planned_km: r.planned_distance_km,
      notes: r.notes,
    })),
    conferences: conferences.map(c => ({
      agency: getAgencyName(c.agency_id),
      sacks: c.qty_sacks,
      cotas: c.qty_cotas,
      sys_a: c.orders_sys_a,
      sys_b: c.orders_sys_b,
      divergent: c.is_divergent,
      reason: c.divergence_reason,
    })),
    kpis: kpis.map(k => ({
      type: k.kpi_type,
      metric: k.metric_name,
      value: k.metric_value,
      unit: k.unit,
      driver: getDriverName(k.driver_id),
      carrier: k.carrier_name,
    })),
    incidents: incidents.map(i => ({
      type: i.incident_type,
      duration_min: i.duration_min,
      impact: i.impact,
      notes: i.notes,
    })),
    closing: closingReports.map(r => ({
      date: r.date,
      packages_out: r.packages_out,
      packages_in_base: r.packages_in_base,
    })),
  };
}
