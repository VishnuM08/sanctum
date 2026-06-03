import { useState } from 'react';
import { COVER_GRADIENTS, COVER_COLORS } from '../types';
import type { CoverConfig } from '../types';

interface Props {
  current?: CoverConfig;
  onChange: (cover: CoverConfig) => void;
  onClose: () => void;
}

type Tab = 'gradients' | 'colors';

export function CoverPicker({ current, onChange, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('gradients');

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 49 }} onClick={onClose} />
      <div className="cover-picker" style={{ zIndex: 50 }}>
        <div className="cover-picker-tabs">
          <button
            className={`cover-picker-tab ${tab === 'gradients' ? 'active' : ''}`}
            onClick={() => setTab('gradients')}
          >
            Gradients
          </button>
          <button
            className={`cover-picker-tab ${tab === 'colors' ? 'active' : ''}`}
            onClick={() => setTab('colors')}
          >
            Colors
          </button>
        </div>

        {tab === 'gradients' && (
          <div className="cover-grid">
            {COVER_GRADIENTS.map((gradient) => (
              <div
                key={gradient}
                className={`cover-swatch ${current?.value === gradient ? 'selected' : ''}`}
                style={{ background: gradient }}
                onClick={() => onChange({ type: 'gradient', value: gradient, position: 50 })}
              />
            ))}
          </div>
        )}

        {tab === 'colors' && (
          <div className="cover-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
            {COVER_COLORS.map((color) => (
              <div
                key={color}
                className={`cover-swatch ${current?.value === color ? 'selected' : ''}`}
                style={{ background: color }}
                onClick={() => onChange({ type: 'color', value: color, position: 50 })}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
