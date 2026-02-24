import { useState } from "react";
import { CrudModal, Field, inputClass, selectClass } from "@/components/CrudModal";
import { mockVehicles, mockDrivers } from "@/data/mockData";
import { Vehicle, Driver } from "@/types/domain";
import { getStore, setStore, addItem, updateItem, deleteItem, genId, STORE_KEYS } from "@/lib/localStorage";
import { Plus, Search, Pencil, Trash2, Truck, User } from "lucide-react";
import { StatusChip } from "@/components/StatusChip";
import { toast } from "sonner";

const KV = STORE_KEYS.VEHICLES;
const KD = STORE_KEYS.DRIVERS;

interface FleetEntry {
  vehicle: Vehicle;
  driver: Driver;
}

const emptyVehicle = (): Vehicle => ({ id: "", plate: "", type: "truck", carrier_name: "", notes: "" });
const emptyDriver = (): Driver => ({ id: "", name: "", document: "", phone: "", carrier_name: "", training_status: "pending" });

export default function Fleet() {
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => getStore(KV, mockVehicles));
  const [drivers, setDrivers] = useState<Driver[]>(() => getStore(KD, mockDrivers));
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<{
    open: boolean;
    vehicle: Vehicle;
    driver: Driver;
    isNew: boolean;
    editingVehicleId: string | null;
  }>({ open: false, vehicle: emptyVehicle(), driver: emptyDriver(), isNew: true, editingVehicleId: null });

  const saveVehicles = (items: Vehicle[]) => { setStore(KV, items); setVehicles(items); };
  const saveDrivers = (items: Driver[]) => { setStore(KD, items); setDrivers(items); };

  // Match vehicles to drivers by carrier_name (first match)
  const entries: (FleetEntry & { hasDriver: boolean })[] = vehicles.map(v => {
    const driver = drivers.find(d => d.carrier_name === v.carrier_name);
    return { vehicle: v, driver: driver || emptyDriver(), hasDriver: !!driver };
  });

  const filtered = entries.filter(e =>
    e.vehicle.plate.toLowerCase().includes(search.toLowerCase()) ||
    e.vehicle.carrier_name.toLowerCase().includes(search.toLowerCase()) ||
    e.driver.name.toLowerCase().includes(search.toLowerCase())
  );

  const openNew = () => {
    const vId = genId();
    const dId = genId();
    setModal({
      open: true,
      vehicle: { ...emptyVehicle(), id: vId },
      driver: { ...emptyDriver(), id: dId },
      isNew: true,
      editingVehicleId: null,
    });
  };

  const openEdit = (v: Vehicle) => {
    const driver = drivers.find(d => d.carrier_name === v.carrier_name) || { ...emptyDriver(), id: genId(), carrier_name: v.carrier_name };
    setModal({
      open: true,
      vehicle: { ...v },
      driver: { ...driver },
      isNew: false,
      editingVehicleId: v.id,
    });
  };

  const close = () => setModal(m => ({ ...m, open: false }));

  const setVehicleField = (field: keyof Vehicle, value: any) =>
    setModal(m => ({ ...m, vehicle: { ...m.vehicle, [field]: value } }));

  const setDriverField = (field: keyof Driver, value: any) =>
    setModal(m => ({ ...m, driver: { ...m.driver, [field]: value } }));

  const handleSave = () => {
    if (!modal.vehicle.plate.trim()) { toast.error("Placa obrigatória"); return; }
    if (!modal.driver.name.trim()) { toast.error("Nome do motorista obrigatório"); return; }

    // Sync carrier_name
    const carrier = modal.vehicle.carrier_name;
    const vehicle = { ...modal.vehicle, carrier_name: carrier };
    const driver = { ...modal.driver, carrier_name: carrier };

    if (modal.isNew) {
      saveVehicles(addItem(KV, mockVehicles, vehicle));
      saveDrivers(addItem(KD, mockDrivers, driver));
    } else {
      saveVehicles(updateItem(KV, mockVehicles, vehicle));
      // Check if driver exists in store
      const existingDrivers = getStore(KD, mockDrivers);
      if (existingDrivers.find(d => d.id === driver.id)) {
        saveDrivers(updateItem(KD, mockDrivers, driver));
      } else {
        saveDrivers(addItem(KD, mockDrivers, driver));
      }
    }
    toast.success(modal.isNew ? "Veículo e motorista cadastrados" : "Cadastro atualizado");
    close();
  };

  const handleDelete = () => {
    saveVehicles(deleteItem(KV, mockVehicles, modal.vehicle.id));
    if (modal.driver.id) {
      saveDrivers(deleteItem(KD, mockDrivers, modal.driver.id));
    }
    toast.success("Veículo e motorista removidos");
    close();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input type="text" placeholder="Buscar placa, transportadora ou motorista..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-lg ops-input text-sm border" />
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2.5 rounded-lg gradient-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity">
          <Plus className="h-4 w-4" /> Novo Cadastro
        </button>
      </div>

      <div className="flex gap-3 text-sm text-muted-foreground">
        <span className="px-3 py-1.5 rounded-lg bg-card border border-border font-medium">{vehicles.length} veículos</span>
        <span className="px-3 py-1.5 rounded-lg bg-card border border-border font-medium">{drivers.length} motoristas</span>
      </div>

      <div className="glass-card rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Placa</th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Tipo</th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Transportadora</th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Motorista</th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Documento</th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Telefone</th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Treinamento</th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map(({ vehicle, driver }) => (
              <tr key={vehicle.id} className="hover:bg-accent/50 transition-colors cursor-pointer" onClick={() => openEdit(vehicle)}>
                <td className="px-4 py-3 font-mono font-bold text-foreground flex items-center gap-2">
                  <Truck className="h-3.5 w-3.5 text-primary" /> {vehicle.plate}
                </td>
                <td className="px-4 py-3 text-muted-foreground capitalize">{vehicle.type}</td>
                <td className="px-4 py-3 text-foreground">{vehicle.carrier_name}</td>
                <td className="px-4 py-3 text-foreground flex items-center gap-2">
                  <User className="h-3.5 w-3.5 text-muted-foreground" /> {driver.name || "—"}
                </td>
                <td className="px-4 py-3 font-mono text-muted-foreground text-xs">{driver.document || "—"}</td>
                <td className="px-4 py-3 text-muted-foreground text-xs">{driver.phone || "—"}</td>
                <td className="px-4 py-3">
                  {driver.training_status && <StatusChip status={driver.training_status} />}
                </td>
                <td className="px-4 py-3">
                  <button className="p-1.5 rounded-md hover:bg-accent text-muted-foreground"><Pencil className="h-3.5 w-3.5" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <CrudModal open={modal.open} onClose={close} title={modal.isNew ? "Novo Cadastro — Veículo + Motorista" : "Editar Cadastro"} onSave={handleSave} onDelete={!modal.isNew ? handleDelete : undefined}>
        {/* Vehicle section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground border-b border-border pb-2">
            <Truck className="h-4 w-4 text-primary" /> Veículo
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Placa">
              <input className={inputClass} value={modal.vehicle.plate} onChange={e => setVehicleField("plate", e.target.value.toUpperCase())} placeholder="ABC-1234" />
            </Field>
            <Field label="Tipo">
              <select className={selectClass} value={modal.vehicle.type} onChange={e => setVehicleField("type", e.target.value)}>
                <option value="truck">Caminhão</option>
                <option value="car">Carro</option>
                <option value="moto">Moto</option>
              </select>
            </Field>
          </div>
          <Field label="Transportadora">
            <input className={inputClass} value={modal.vehicle.carrier_name} onChange={e => {
              setVehicleField("carrier_name", e.target.value);
              setDriverField("carrier_name", e.target.value);
            }} placeholder="Nome da transportadora" />
          </Field>
          <Field label="Observações do veículo">
            <input className={inputClass} value={modal.vehicle.notes} onChange={e => setVehicleField("notes", e.target.value)} placeholder="Ex: Refrigerado" />
          </Field>
        </div>

        {/* Driver section */}
        <div className="space-y-3 mt-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground border-b border-border pb-2">
            <User className="h-4 w-4 text-primary" /> Motorista
          </div>
          <Field label="Nome completo">
            <input className={inputClass} value={modal.driver.name} onChange={e => setDriverField("name", e.target.value)} placeholder="Nome do motorista" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="CPF / Documento">
              <input className={inputClass} value={modal.driver.document} onChange={e => setDriverField("document", e.target.value)} placeholder="123.456.789-00" />
            </Field>
            <Field label="Telefone">
              <input className={inputClass} value={modal.driver.phone} onChange={e => setDriverField("phone", e.target.value)} placeholder="(14) 99123-4567" />
            </Field>
          </div>
          <Field label="Status treinamento">
            <select className={selectClass} value={modal.driver.training_status} onChange={e => setDriverField("training_status", e.target.value)}>
              <option value="ok">OK</option>
              <option value="pending">Pendente</option>
            </select>
          </Field>
        </div>
      </CrudModal>
    </div>
  );
}
