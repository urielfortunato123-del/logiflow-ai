import { Upload, FileText, Image, Eye, Trash2, Send } from "lucide-react";
import { useState, useRef } from "react";
import { genId, getStore, setStore, STORE_KEYS } from "@/lib/localStorage";
import { toast } from "sonner";

interface Attachment {
  id: string;
  filename: string;
  mime: string;
  size_bytes: number;
  extracted_text: string;
  created_at: string;
}

const K = STORE_KEYS.ATTACHMENTS;

export default function OCRCenter() {
  const [dragActive, setDragActive] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>(() => getStore(K, []));
  const [preview, setPreview] = useState<Attachment | null>(null);
  const [processing, setProcessing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const save = (items: Attachment[]) => { setStore(K, items); setAttachments(items); };

  const processFile = async (file: File) => {
    setProcessing(true);
    try {
      // Read file as text for basic extraction
      let extractedText = "";
      if (file.type.includes("text") || file.name.endsWith(".csv")) {
        extractedText = await file.text();
      } else {
        // For images/PDFs we store metadata — real OCR would go through edge function
        extractedText = `[Arquivo: ${file.name}]\nTipo: ${file.type}\nTamanho: ${(file.size / 1024).toFixed(1)} KB\n\nPara OCR completo, conecte um serviço de extração de texto.`;
      }

      const attachment: Attachment = {
        id: genId(),
        filename: file.name,
        mime: file.type,
        size_bytes: file.size,
        extracted_text: extractedText,
        created_at: new Date().toISOString(),
      };

      save([attachment, ...attachments]);
      toast.success(`${file.name} processado`);
    } catch {
      toast.error("Erro ao processar arquivo");
    }
    setProcessing(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files);
    files.forEach(processFile);
  };

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(processFile);
  };

  const deleteAttachment = (id: string) => {
    save(attachments.filter(a => a.id !== id));
    if (preview?.id === id) setPreview(null);
    toast.success("Arquivo removido");
  };

  return (
    <div className="max-w-3xl space-y-6">
      <input ref={fileRef} type="file" className="hidden" accept="image/*,.pdf,.csv,.txt" multiple onChange={handleSelect} />

      <div
        onDragOver={e => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        className={`glass-card rounded-lg p-12 text-center border-2 border-dashed transition-colors cursor-pointer ${dragActive ? "border-primary bg-primary/5" : "border-border"}`}
      >
        <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
        <p className="text-sm font-medium text-foreground mb-1">{processing ? "Processando..." : "Arraste imagens ou PDFs aqui"}</p>
        <p className="text-xs text-muted-foreground mb-4">Suporta JPG, PNG, PDF, CSV, TXT</p>
        <button className="px-6 py-2.5 rounded-lg gradient-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity">Selecionar Arquivos</button>
      </div>

      {preview && (
        <div className="glass-card rounded-lg p-5 animate-fade-in-up">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm text-foreground">{preview.filename}</h3>
            <button onClick={() => setPreview(null)} className="text-xs text-muted-foreground hover:text-foreground">Fechar</button>
          </div>
          <pre className="text-sm text-foreground whitespace-pre-wrap font-mono bg-muted/50 p-4 rounded-lg max-h-60 overflow-y-auto">{preview.extracted_text}</pre>
        </div>
      )}

      <div className="glass-card rounded-lg">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="font-semibold text-sm text-foreground">Arquivos ({attachments.length})</h3>
        </div>
        {attachments.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Nenhum arquivo processado ainda</div>
        ) : (
          <div className="divide-y divide-border">
            {attachments.map(file => (
              <div key={file.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  {file.mime.includes("pdf") ? <FileText className="h-5 w-5 text-critical" /> : file.mime.includes("image") ? <Image className="h-5 w-5 text-info" /> : <FileText className="h-5 w-5 text-muted-foreground" />}
                  <div>
                    <p className="text-sm font-medium text-foreground">{file.filename}</p>
                    <p className="text-xs text-muted-foreground">{(file.size_bytes / 1024).toFixed(1)} KB • {new Date(file.created_at).toLocaleString("pt-BR")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => setPreview(file)} className="p-2 rounded-md hover:bg-accent text-muted-foreground" title="Visualizar"><Eye className="h-4 w-4" /></button>
                  <button onClick={() => deleteAttachment(file.id)} className="p-2 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive" title="Excluir"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
