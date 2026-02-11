import { Translations } from '../types/translations';

interface HelpManualProps {
  isOpen: boolean;
  onClose: () => void;
  translations: Translations;
}

export function HelpManual({ isOpen, onClose, translations }: HelpManualProps) {
  if (!isOpen) return null;

  const { help } = translations;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{help.title}</h2>
          <button className="modal-close" onClick={onClose} aria-label={help.close}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          <section className="help-section">
            <h3>{help.basics.title}</h3>
            <div dangerouslySetInnerHTML={{ __html: help.basics.content }} />
          </section>

          <section className="help-section">
            <h3>{help.features.title}</h3>
            <div dangerouslySetInnerHTML={{ __html: help.features.modelEdit }} />
            <div dangerouslySetInnerHTML={{ __html: help.features.eigenAnalysis }} />
            <div dangerouslySetInnerHTML={{ __html: help.features.waveGeneration }} />
            <div dangerouslySetInnerHTML={{ __html: help.features.responseAnalysis }} />
          </section>

          <section className="help-section">
            <h3>{help.dataIO.title}</h3>
            <div dangerouslySetInnerHTML={{ __html: help.dataIO.content }} />
          </section>
        </div>

        <div className="modal-footer">
          <button onClick={onClose}>{help.close}</button>
        </div>
      </div>
    </div>
  );
}
