import { useState } from 'react';
import type { Translations } from '../types/translations';
import { storage } from '../utils/localStorage';
import { ja } from '../locales/ja';
import { en } from '../locales/en';

interface WelcomeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  translations: Translations;
}

export function WelcomeDialog({ isOpen, onClose, translations }: WelcomeDialogProps) {
  const [dismissChecked, setDismissChecked] = useState(false);

  if (!isOpen) return null;

  const { welcome } = translations;
  const isJa = translations === ja;
  const secondary = isJa ? en.welcome : ja.welcome;

  const handleClose = () => {
    if (dismissChecked) {
      storage.setWelcomeDismissed(true);
    }
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{welcome.title}</h2>
          <button className="modal-close" onClick={handleClose} aria-label={welcome.close}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          {/* Primary language */}
          <section className="help-section">
            <h3>{welcome.sampleDataTitle}</h3>
            <div className="help-content" dangerouslySetInnerHTML={{ __html: welcome.sampleDataDesc }} />
          </section>

          <section className="help-section">
            <h3>{welcome.workflowTitle}</h3>
            <div className="help-content" dangerouslySetInnerHTML={{ __html: welcome.workflowSteps }} />
          </section>

          <section className="help-section">
            <h3>{welcome.dataManageTitle}</h3>
            <div className="help-content" dangerouslySetInnerHTML={{ __html: welcome.dataManageDesc }} />
          </section>

          {/* Secondary language */}
          <hr className="welcome-divider" />

          <section className="help-section">
            <h3>{secondary.sampleDataTitle}</h3>
            <div className="help-content" dangerouslySetInnerHTML={{ __html: secondary.sampleDataDesc }} />
          </section>

          <section className="help-section">
            <h3>{secondary.workflowTitle}</h3>
            <div className="help-content" dangerouslySetInnerHTML={{ __html: secondary.workflowSteps }} />
          </section>

          <section className="help-section">
            <h3>{secondary.dataManageTitle}</h3>
            <div className="help-content" dangerouslySetInnerHTML={{ __html: secondary.dataManageDesc }} />
          </section>
        </div>

        <div className="modal-footer">
          <label className="welcome-dismiss">
            <input
              type="checkbox"
              checked={dismissChecked}
              onChange={(e) => setDismissChecked(e.target.checked)}
            />
            {welcome.dismiss}
          </label>
          <button onClick={handleClose}>{welcome.close}</button>
        </div>
      </div>
    </div>
  );
}
