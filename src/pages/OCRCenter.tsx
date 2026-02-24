import { Upload, FileText, Image, Eye } from "lucide-react";
import { useState } from "react";

export default function OCRCenter() {
  const [dragActive, setDragActive] = useState(false);

  return (
    <div className="max-w-3xl space-y-6">
      {/* Upload area */}
      <div
        onDragOver={e => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={e => { e.preventDefault(); setDragActive(false); }}
        className={`glass-card rounded-lg p-12 text-center border-2 border-dashed transition-colors ${dragActive ? "border-primary bg-primary/5" : "border-border"}`}
      >
        <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
        <p className="text-sm font-medium text-foreground mb-1">Arraste imagens ou PDFs aqui</p>
        <p className="text-xs text-muted-foreground mb-4">Suporta JPG, PNG, PDF • OCR com Tesseract (pt-BR)</p>
        <button className="px-6 py-2.5 rounded-lg gradient-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity">
          Selecionar Arquivos
        </button>
      </div>

      {/* Sample extracted results */}
      <div className="glass-card rounded-lg">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="font-semibold text-sm text-foreground">Extrações Recentes</h3>
        </div>
        <div className="divide-y divide-border">
          {[
            { name: "relatorio_sys_a.pdf", type: "PDF", status: "Extraído", fields: 12 },
            { name: "captura_tela.png", type: "Image", status: "Processado", fields: 8 },
          ].map((file, i) => (
            <div key={i} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                {file.type === "PDF" ? <FileText className="h-5 w-5 text-critical" /> : <Image className="h-5 w-5 text-info" />}
                <div>
                  <p className="text-sm font-medium text-foreground">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{file.fields} campos extraídos</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="status-chip bg-success/20 text-success border border-success/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-success" />{file.status}
                </span>
                <button className="p-2 rounded-md hover:bg-accent text-muted-foreground">
                  <Eye className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
