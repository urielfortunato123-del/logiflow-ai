import { useState } from "react";
import { CrudModal, Field, inputClass } from "@/components/CrudModal";
import { getStore, setStore, genId, STORE_KEYS } from "@/lib/localStorage";
import { Compass, MapPin, RefreshCw, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface CoverageCity { id: string; city: string; uf: string; distance_km: number; }

const defaultCities: CoverageCity[] = [
  { id: "cc1", city: "Marília", uf: "SP", distance_km: 0 },
  { id: "cc2", city: "Bauru", uf: "SP", distance_km: 95 },
  { id: "cc3", city: "Assis", uf: "SP", distance_km: 105 },
  { id: "cc4", city: "Ourinhos", uf: "SP", distance_km: 120 },
  { id: "cc5", city: "Tupã", uf: "SP", distance_km: 72 },
  { id: "cc6", city: "Garça", uf: "SP", distance_km: 48 },
  { id: "cc7", city: "Pompeia", uf: "SP", distance_km: 30 },
  { id: "cc8", city: "Vera Cruz", uf: "SP", distance_km: 22 },
  { id: "cc9", city: "Lins", uf: "SP", distance_km: 85 },
  { id: "cc10", city: "Presidente Prudente", uf: "SP", distance_km: 198 },
  { id: "cc11", city: "Jaú", uf: "SP", distance_km: 155 },
  { id: "cc12", city: "Botucatu", uf: "SP", distance_km: 185 },
  { id: "cc13", city: "Avaré", uf: "SP", distance_km: 170 },
  { id: "cc14", city: "Piraju", uf: "SP", distance_km: 145 },
  { id: "cc15", city: "Adamantina", uf: "SP", distance_km: 110 },
];

const K = STORE_KEYS.COVERAGE_CITIES;
const emptyCity = (): CoverageCity => ({ id: "", city: "", uf: "SP", distance_km: 0 });

export default function Coverage() {
  const [cities, setCities] = useState<CoverageCity[]>(() => getStore(K, defaultCities));
  const [radius] = useState(200);
  const [modal, setModal] = useState<{ open: boolean; city: CoverageCity; isNew: boolean }>({ open: false, city: emptyCity(), isNew: true });

  const save = (items: CoverageCity[]) => { setStore(K, items); setCities(items); };

  const openNew = () => setModal({ open: true, city: { ...emptyCity(), id: genId() }, isNew: true });
  const openEdit = (c: CoverageCity) => setModal({ open: true, city: { ...c }, isNew: false });
  const close = () => setModal(m => ({ ...m, open: false }));
  const setField = (field: keyof CoverageCity, value: any) => setModal(m => ({ ...m, city: { ...m.city, [field]: value } }));

  const handleSave = () => {
    if (!modal.city.city.trim()) { toast.error("Nome da cidade obrigatório"); return; }
    if (modal.isNew) save([...cities, modal.city]);
    else save(cities.map(c => c.id === modal.city.id ? modal.city : c));
    toast.success(modal.isNew ? "Cidade adicionada" : "Cidade atualizada");
    close();
  };
  const handleDelete = () => { save(cities.filter(c => c.id !== modal.city.id)); toast.success("Cidade removida"); close(); };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="glass-card rounded-lg p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-lg bg-primary/10"><Compass className="h-5 w-5 text-primary" /></div>
          <div>
            <h3 className="font-semibold text-foreground">Área de Cobertura</h3>
            <p className="text-xs text-muted-foreground">Marília-SP • Raio de {radius}km</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:bg-accent transition-colors"><RefreshCw className="h-4 w-4" /> Gerar Cidades</button>
          <button onClick={openNew} className="flex items-center gap-2 px-4 py-2.5 rounded-lg gradient-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"><Plus className="h-4 w-4" /> Adicionar</button>
          <span className="text-sm text-muted-foreground">{cities.length} cidades</span>
        </div>
      </div>

      <div className="glass-card rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Cidade</th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">UF</th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Distância</th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {cities.map(c => (
              <tr key={c.id} className="hover:bg-accent/50 transition-colors cursor-pointer" onClick={() => openEdit(c)}>
                <td className="px-4 py-3 font-medium text-foreground flex items-center gap-2"><MapPin className="h-3 w-3 text-primary" /> {c.city}</td>
                <td className="px-4 py-3 text-muted-foreground">{c.uf}</td>
                <td className="px-4 py-3 font-mono text-foreground">{c.distance_km} km</td>
                <td className="px-4 py-3">
                  <span className={`status-chip ${c.distance_km <= radius ? "bg-success/20 text-success border border-success/30" : "bg-warning/20 text-warning border border-warning/30"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${c.distance_km <= radius ? "bg-success" : "bg-warning"}`} />
                    {c.distance_km <= radius ? "Dentro" : "Limite"}
                  </span>
                </td>
                <td className="px-4 py-3"><button className="p-1.5 rounded-md hover:bg-accent text-muted-foreground"><Pencil className="h-3.5 w-3.5" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <CrudModal open={modal.open} onClose={close} title={modal.isNew ? "Adicionar Cidade" : "Editar Cidade"} onSave={handleSave} onDelete={!modal.isNew ? handleDelete : undefined}>
        <Field label="Cidade"><input className={inputClass} value={modal.city.city} onChange={e => setField("city", e.target.value)} /></Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="UF"><input className={inputClass} value={modal.city.uf} onChange={e => setField("uf", e.target.value.toUpperCase())} maxLength={2} /></Field>
          <Field label="Distância (km)"><input type="number" className={inputClass} value={modal.city.distance_km} onChange={e => setField("distance_km", Number(e.target.value))} /></Field>
        </div>
      </CrudModal>
    </div>
  );
}
