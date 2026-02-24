import { X } from "lucide-react";
import { ReactNode, useEffect } from "react";

interface CrudModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  onSave?: () => void;
  onDelete?: () => void;
  saveLabel?: string;
}

export function CrudModal({ open, onClose, title, children, onSave, onDelete, saveLabel = "Salvar" }: CrudModalProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto glass-card rounded-xl border border-border shadow-2xl animate-fade-in-up">
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-border bg-card rounded-t-xl">
          <h2 className="font-semibold text-foreground">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-accent text-muted-foreground"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-5 space-y-4">{children}</div>
        <div className="sticky bottom-0 flex items-center gap-2 px-5 py-4 border-t border-border bg-card rounded-b-xl">
          {onDelete && (
            <button onClick={onDelete} className="px-4 py-2.5 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium hover:opacity-90">Excluir</button>
          )}
          <div className="flex-1" />
          <button onClick={onClose} className="px-4 py-2.5 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:bg-accent">Cancelar</button>
          {onSave && (
            <button onClick={onSave} className="px-4 py-2.5 rounded-lg gradient-primary text-primary-foreground text-sm font-semibold hover:opacity-90">{saveLabel}</button>
          )}
        </div>
      </div>
    </div>
  );
}

interface FieldProps {
  label: string;
  children: ReactNode;
}

export function Field({ label, children }: FieldProps) {
  return (
    <div>
      <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1.5">{label}</label>
      {children}
    </div>
  );
}

export const inputClass = "w-full px-3 py-2.5 rounded-lg ops-input text-sm border bg-background text-foreground";
export const selectClass = "w-full px-3 py-2.5 rounded-lg ops-input text-sm border bg-background text-foreground";
