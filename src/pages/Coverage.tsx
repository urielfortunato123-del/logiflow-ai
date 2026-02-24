import { Compass, MapPin, RefreshCw } from "lucide-react";
import { useState } from "react";

const defaultCities = [
  { city: "Marília", uf: "SP", distance_km: 0 },
  { city: "Bauru", uf: "SP", distance_km: 95 },
  { city: "Assis", uf: "SP", distance_km: 105 },
  { city: "Ourinhos", uf: "SP", distance_km: 120 },
  { city: "Tupã", uf: "SP", distance_km: 72 },
  { city: "Garça", uf: "SP", distance_km: 48 },
  { city: "Pompeia", uf: "SP", distance_km: 30 },
  { city: "Vera Cruz", uf: "SP", distance_km: 22 },
  { city: "Lins", uf: "SP", distance_km: 85 },
  { city: "Presidente Prudente", uf: "SP", distance_km: 198 },
  { city: "Jaú", uf: "SP", distance_km: 155 },
  { city: "Botucatu", uf: "SP", distance_km: 185 },
  { city: "Avaré", uf: "SP", distance_km: 170 },
  { city: "Piraju", uf: "SP", distance_km: 145 },
  { city: "Adamantina", uf: "SP", distance_km: 110 },
];

export default function Coverage() {
  const [cities] = useState(defaultCities);
  const [radius] = useState(200);

  return (
    <div className="max-w-3xl space-y-6">
      <div className="glass-card rounded-lg p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-lg bg-primary/10">
            <Compass className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Área de Cobertura</h3>
            <p className="text-xs text-muted-foreground">Marília-SP • Raio de {radius}km</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg gradient-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity">
            <RefreshCw className="h-4 w-4" /> Gerar Cidades
          </button>
          <span className="text-sm text-muted-foreground">{cities.length} cidades na cobertura</span>
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
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {cities.map((c, i) => (
              <tr key={i} className="hover:bg-accent/50 transition-colors">
                <td className="px-4 py-3 font-medium text-foreground flex items-center gap-2">
                  <MapPin className="h-3 w-3 text-primary" /> {c.city}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{c.uf}</td>
                <td className="px-4 py-3 font-mono text-foreground">{c.distance_km} km</td>
                <td className="px-4 py-3">
                  <span className={`status-chip ${c.distance_km <= radius ? "bg-success/20 text-success border border-success/30" : "bg-warning/20 text-warning border border-warning/30"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${c.distance_km <= radius ? "bg-success" : "bg-warning"}`} />
                    {c.distance_km <= radius ? "Dentro" : "Limite"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
