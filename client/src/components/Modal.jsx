import { X } from "lucide-react";

export default function Modal({ open, title, eyebrow, children, onClose, className = "" }) {
  if (!open) return null;

  return (
    <div className="structured-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className={`structured-modal ${className}`}
        role="dialog"
        aria-modal="true"
        aria-label={title || eyebrow || "Modal"}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="structured-modal-header">
          <div>
            {eyebrow && <span className="structured-eyebrow">{eyebrow}</span>}
            {title && <h2>{title}</h2>}
          </div>
          <button type="button" className="structured-icon-button" onClick={onClose} aria-label="Fechar">
            <X size={18} />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}
