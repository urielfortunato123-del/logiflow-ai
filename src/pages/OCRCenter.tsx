import { Upload, FileText, Image, Eye, Trash2, Sparkles, Loader2, ScanLine, FileSpreadsheet, Presentation, Download } from "lucide-react";
import { useState, useRef } from "react";
import { genId, getStore, setStore, STORE_KEYS } from "@/lib/localStorage";
import { toast } from "sonner";
import mammoth from "mammoth";
import * as XLSX from "xlsx";

interface Attachment {
  id: string;
  filename: string;
  mime: string;
  size_bytes: number;
  extracted_text: string;
  created_at: string;
  page_count?: number;
}

const K = STORE_KEYS.ATTACHMENTS;
const OCR_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ocr-extract`;
const AI_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assist`;

export default function OCRCenter() {
  const [dragActive, setDragActive] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>(() => getStore(K, []));
  const [preview, setPreview] = useState<Attachment | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const save = (items: Attachment[]) => { setStore(K, items); setAttachments(items); };

  const processFile = async (file: File) => {
    setProcessing(true);
    setProgressMsg(`Processando ${file.name}...`);
    try {
      let extractedText = "";
      let pageCount: number | undefined;

      if (file.type.includes("text") || file.name.endsWith(".csv")) {
        extractedText = await file.text();
      } else if (file.type === "application/pdf") {
        setProgressMsg("Convertendo PDF em imagens...");
        const result = await processPdf(file, (page, total) => {
          setProgressMsg(`OCR página ${page}/${total}...`);
        });
        extractedText = result.text;
        pageCount = result.pages;
      } else if (file.type.startsWith("image/")) {
        setProgressMsg("Extraindo texto da imagem...");
        extractedText = await ocrImage(file);
      } else if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || file.name.endsWith(".docx")) {
        setProgressMsg("Convertendo documento Word...");
        extractedText = await processDocx(file);
      } else if (
        file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        file.type === "application/vnd.ms-excel" ||
        file.name.endsWith(".xlsx") || file.name.endsWith(".xls")
      ) {
        setProgressMsg("Convertendo planilha Excel...");
        extractedText = await processExcel(file);
      } else if (
        file.type === "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
        file.name.endsWith(".pptx")
      ) {
        setProgressMsg("Convertendo apresentação PowerPoint...");
        extractedText = await processPptx(file);
      } else if (file.type === "application/msword" || file.name.endsWith(".doc")) {
        setProgressMsg("Extraindo texto do Word legado...");
        extractedText = await processLegacyBinary(file, "doc");
      } else if (file.type === "application/vnd.ms-powerpoint" || file.name.endsWith(".ppt")) {
        setProgressMsg("Extraindo texto do PowerPoint legado...");
        extractedText = await processLegacyBinary(file, "ppt");
      } else {
        extractedText = `[Arquivo: ${file.name}]\nTipo: ${file.type}\nTamanho: ${(file.size / 1024).toFixed(1)} KB\n\nFormato não suportado. Envie imagens, PDFs, DOCX, DOC, XLSX, XLS, PPTX, PPT, CSV ou TXT.`;
      }

      const attachment: Attachment = {
        id: genId(),
        filename: file.name,
        mime: file.type,
        size_bytes: file.size,
        extracted_text: extractedText,
        created_at: new Date().toISOString(),
        page_count: pageCount,
      };

      save([attachment, ...attachments]);
      toast.success(`${file.name} processado${pageCount ? ` (${pageCount} páginas)` : ""}`);
    } catch {
      toast.error("Erro ao processar arquivo");
    }
    setProcessing(false);
    setProgressMsg("");
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

  const exportToMarkdown = (att: Attachment) => {
    const mdName = att.filename.replace(/\.[^.]+$/, "") + ".md";
    const header = `# ${att.filename}\n\n> Extraído em ${new Date(att.created_at).toLocaleString("pt-BR")}${att.page_count ? ` • ${att.page_count} páginas` : ""}\n\n---\n\n`;
    const blob = new Blob([header + att.extracted_text], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = mdName;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${mdName} exportado`);
  };

  const deleteAttachment = (id: string) => {
    save(attachments.filter(a => a.id !== id));
    if (preview?.id === id) setPreview(null);
    toast.success("Arquivo removido");
  };

  return (
    <div className="max-w-3xl space-y-6">
      <input ref={fileRef} type="file" className="hidden" accept="image/*,.pdf,.csv,.txt,.docx,.doc,.xlsx,.xls,.pptx,.ppt" multiple onChange={handleSelect} />

      <div
        onDragOver={e => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        className={`glass-card rounded-lg p-12 text-center border-2 border-dashed transition-colors cursor-pointer ${dragActive ? "border-primary bg-primary/5" : "border-border"}`}
      >
        <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
        <p className="text-sm font-medium text-foreground mb-1">
          {processing ? progressMsg || "Processando..." : "Arraste imagens ou PDFs aqui"}
        </p>
        <p className="text-xs text-muted-foreground mb-1">Suporta JPG, PNG, PDF, DOCX, DOC, XLSX, XLS, PPTX, PPT, CSV, TXT</p>
        <p className="text-xs text-muted-foreground mb-4 flex items-center justify-center gap-1">
          <ScanLine className="h-3 w-3" /> OCR automático para imagens e PDFs (Hugging Face + Gemini Vision)
        </p>
        {processing && (
          <div className="flex items-center justify-center gap-2 mb-4">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span className="text-xs text-primary font-medium">{progressMsg}</span>
          </div>
        )}
        <button className="px-6 py-2.5 rounded-lg gradient-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity">
          Selecionar Arquivos
        </button>
      </div>

      {preview && (
        <div className="glass-card rounded-lg p-5 animate-fade-in-up">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-semibold text-sm text-foreground">{preview.filename}</h3>
              {preview.page_count && (
                <span className="text-xs text-muted-foreground">{preview.page_count} páginas extraídas</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => exportToMarkdown(preview)} className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors" title="Exportar .md">
                <Download className="h-3.5 w-3.5" /> .md
              </button>
              <button onClick={() => setPreview(null)} className="text-xs text-muted-foreground hover:text-foreground">Fechar</button>
            </div>
          </div>
          <pre className="text-sm text-foreground whitespace-pre-wrap font-mono bg-muted/50 p-4 rounded-lg max-h-60 overflow-y-auto">{preview.extracted_text}</pre>
          <OcrAiAnalysis text={preview.extracted_text} filename={preview.filename} />
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
                  {file.mime.includes("pdf") ? <FileText className="h-5 w-5 text-critical" /> : file.mime.includes("image") ? <Image className="h-5 w-5 text-info" /> : file.mime.includes("word") || file.mime === "application/msword" || file.filename.endsWith(".docx") || file.filename.endsWith(".doc") ? <FileText className="h-5 w-5 text-blue-500" /> : file.mime.includes("sheet") || file.mime.includes("excel") || file.filename.endsWith(".xlsx") || file.filename.endsWith(".xls") ? <FileSpreadsheet className="h-5 w-5 text-green-500" /> : file.mime.includes("presentation") || file.mime === "application/vnd.ms-powerpoint" || file.filename.endsWith(".pptx") || file.filename.endsWith(".ppt") ? <Presentation className="h-5 w-5 text-orange-500" /> : <FileText className="h-5 w-5 text-muted-foreground" />}
                  <div>
                    <p className="text-sm font-medium text-foreground">{file.filename}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size_bytes / 1024).toFixed(1)} KB
                      {file.page_count ? ` • ${file.page_count} pág.` : ""}
                      {" • "}{new Date(file.created_at).toLocaleString("pt-BR")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => exportToMarkdown(file)} className="p-2 rounded-md hover:bg-accent text-muted-foreground" title="Exportar .md"><Download className="h-4 w-4" /></button>
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

/* ── PDF to images using pdf.js ── */
async function processPdf(file: File, onProgress: (page: number, total: number) => void): Promise<{ text: string; pages: number }> {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const totalPages = Math.min(pdf.numPages, 10); // Limit to 10 pages

  const pageTexts: string[] = [];

  for (let i = 1; i <= totalPages; i++) {
    onProgress(i, totalPages);
    const page = await pdf.getPage(i);

    // Render page to canvas
    const scale = 2; // Higher quality
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d")!;

    await page.render({ canvasContext: ctx, viewport }).promise;

    // Convert to base64
    const base64 = canvas.toDataURL("image/png");

    // Send to OCR
    try {
      const resp = await fetch(OCR_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          image_base64: base64,
          filename: `${file.name} - página ${i}`,
        }),
      });

      if (resp.ok) {
        const data = await resp.json();
        pageTexts.push(`── Página ${i} ──\n${data.extracted_text || "[sem texto]"}`);
      } else {
        const err = await resp.json().catch(() => ({}));
        pageTexts.push(`── Página ${i} ──\n[Erro: ${err.error || "falha na extração"}]`);
      }
    } catch {
      pageTexts.push(`── Página ${i} ──\n[Erro de conexão]`);
    }

    // Cleanup
    canvas.remove();
  }

  if (pdf.numPages > 10) {
    pageTexts.push(`\n⚠️ PDF tem ${pdf.numPages} páginas. Apenas as 10 primeiras foram processadas.`);
  }

  return { text: pageTexts.join("\n\n"), pages: totalPages };
}

/* ── DOCX to text using mammoth ── */
async function processDocx(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value || "[Nenhum texto extraído do documento]";
}

/* ── Excel to text using xlsx ── */
async function processExcel(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: "array" });
  const parts: string[] = [];
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const csv = XLSX.utils.sheet_to_csv(sheet);
    parts.push(`── ${sheetName} ──\n${csv}`);
  }
  return parts.join("\n\n") || "[Planilha vazia]";
}

/* ── PPTX to text (basic XML extraction) ── */
async function processPptx(file: File): Promise<string> {
  try {
    const JSZip = (await import("jszip")).default;
    const zip = await JSZip.loadAsync(await file.arrayBuffer());
    const slideFiles = Object.keys(zip.files)
      .filter(f => f.match(/ppt\/slides\/slide\d+\.xml$/))
      .sort();

    const slides: string[] = [];
    for (const slidePath of slideFiles) {
      const xml = await zip.files[slidePath].async("text");
      const texts = xml.match(/<a:t>([^<]*)<\/a:t>/g)?.map(m => m.replace(/<\/?a:t>/g, "")) || [];
      const slideNum = slidePath.match(/slide(\d+)/)?.[1] || "?";
      if (texts.length) slides.push(`── Slide ${slideNum} ──\n${texts.join(" ")}`);
    }
    return slides.join("\n\n") || "[Nenhum texto encontrado na apresentação]";
  } catch {
    return "[Erro ao processar PPTX]";
  }
}

/* ── Legacy .doc / .ppt binary text extraction ── */
async function processLegacyBinary(file: File, type: "doc" | "ppt"): Promise<string> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  // Extract readable text runs from the OLE2 binary
  // This scans for sequences of printable characters (basic but effective)
  const textChunks: string[] = [];
  let current = "";
  const minLen = 4; // minimum chars to consider a valid text run

  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i];
    // Check for printable ASCII or common Latin-1 chars
    if ((b >= 0x20 && b <= 0x7E) || (b >= 0xC0 && b <= 0xFF) || b === 0x0A || b === 0x0D || b === 0x09) {
      current += String.fromCharCode(b);
    } else if (b === 0x00 && i + 1 < bytes.length && bytes[i + 1] >= 0x20 && bytes[i + 1] <= 0x7E) {
      // Skip null bytes in UTF-16LE encoded text (common in .doc/.ppt)
      continue;
    } else {
      if (current.trim().length >= minLen) {
        textChunks.push(current.trim());
      }
      current = "";
    }
  }
  if (current.trim().length >= minLen) {
    textChunks.push(current.trim());
  }

  if (!textChunks.length) {
    return `[Nenhum texto extraído do arquivo ${type.toUpperCase()} legado]`;
  }

  // Filter out binary noise: remove chunks that are mostly non-alphanumeric
  const cleaned = textChunks.filter(chunk => {
    const alphaCount = (chunk.match(/[a-zA-ZÀ-ÿ0-9\s]/g) || []).length;
    return alphaCount / chunk.length > 0.6;
  });

  const label = type === "doc" ? "Word" : "PowerPoint";
  const header = `📄 Texto extraído (${label} legado):\n⚠️ Formato binário antigo — a extração pode conter artefatos.\n\n`;
  return header + (cleaned.join("\n") || "[Nenhum texto legível encontrado]");
}

/* ── Send single image to OCR edge function ── */
async function ocrImage(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = reader.result as string;
        const resp = await fetch(OCR_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ image_base64: base64, filename: file.name }),
        });

        if (resp.status === 503) {
          resolve(`[OCR] Modelo carregando. Tente novamente em ~30 segundos.`);
          return;
        }

        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}));
          resolve(`[OCR Erro] ${err.error || "Falha na extração"}`);
          return;
        }

        const data = await resp.json();
        resolve(data.extracted_text || "[Nenhum texto extraído]");
      } catch (e: any) {
        resolve(`[OCR Erro] ${e.message || "Falha na conexão"}`);
      }
    };
    reader.readAsDataURL(file);
  });
}

/* ── AI Analysis sub-component ── */
function OcrAiAnalysis({ text, filename }: { text: string; filename: string }) {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);

  const analyze = async () => {
    setLoading(true);
    setAnalysis(null);
    try {
      const resp = await fetch(AI_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          module: "OCR Center",
          fields: { filename, extracted_text: text.slice(0, 2000) },
          field_target: "análise e interpretação do texto extraído",
        }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || "Erro ao analisar");
      }
      const data = await resp.json();
      setAnalysis(data.suggestion || "Sem análise disponível.");
    } catch (e: any) {
      toast.error(e.message || "Erro ao conectar com a IA");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-3 space-y-2">
      {analysis ? (
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 animate-fade-in-up">
          <div className="flex items-center gap-2 text-xs font-medium text-primary mb-2">
            <Sparkles className="h-3 w-3" /> Análise da IA
          </div>
          <p className="text-sm text-foreground whitespace-pre-wrap">{analysis}</p>
          <button onClick={() => setAnalysis(null)} className="mt-2 text-xs text-muted-foreground hover:text-foreground">Fechar</button>
        </div>
      ) : (
        <button
          onClick={analyze}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
          {loading ? "Analisando..." : "Interpretar com IA"}
        </button>
      )}
    </div>
  );
}
