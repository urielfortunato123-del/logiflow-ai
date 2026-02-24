// Generic localStorage CRUD service with seed data support

export function getStore<T>(key: string, seed: T[]): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
    localStorage.setItem(key, JSON.stringify(seed));
    return seed;
  } catch {
    return seed;
  }
}

export function setStore<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

export function addItem<T extends { id: string }>(key: string, seed: T[], item: T): T[] {
  const items = getStore<T>(key, seed);
  const updated = [...items, item];
  setStore(key, updated);
  return updated;
}

export function updateItem<T extends { id: string }>(key: string, seed: T[], item: T): T[] {
  const items = getStore<T>(key, seed);
  const updated = items.map(i => (i.id === item.id ? item : i));
  setStore(key, updated);
  return updated;
}

export function deleteItem<T extends { id: string }>(key: string, seed: T[], id: string): T[] {
  const items = getStore<T>(key, seed);
  const updated = items.filter(i => i.id !== id);
  setStore(key, updated);
  return updated;
}

export function genId(): string {
  return crypto.randomUUID?.() || Math.random().toString(36).slice(2, 11);
}

// Store keys
export const STORE_KEYS = {
  GATE_ORDERS: "logiops_gate_orders",
  ROUTES: "logiops_routes",
  CONFERENCES: "logiops_conferences",
  KPIS: "logiops_kpis",
  INCIDENTS: "logiops_incidents",
  CLOSING_REPORTS: "logiops_closing_reports",
  DRIVERS: "logiops_drivers",
  VEHICLES: "logiops_vehicles",
  AGENCIES: "logiops_agencies",
  COVERAGE_CITIES: "logiops_coverage_cities",
  ATTACHMENTS: "logiops_attachments",
} as const;
