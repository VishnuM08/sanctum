import { useState } from 'react';
import { COVER_GRADIENTS, COVER_COLORS } from '../types';
import type { CoverConfig } from '../types';
import coverMountains from '../assets/notion/cover_mountains.png';

interface Props {
  current?: CoverConfig;
  onChange: (cover: CoverConfig) => void;
  onClose: () => void;
}

type Tab = 'images' | 'gradients' | 'colors';

const COVER_IMAGES = [
  coverMountains,
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop', // Abstract minimalist 3D shapes
  'https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=800&auto=format&fit=crop', // Foggy/misty pine forest
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop', // Golden sand beach shoreline
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=800&auto=format&fit=crop', // Sunset valley mountain landscape
  'https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?q=80&w=800&auto=format&fit=crop', // Deep space stars and cosmos
  'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=800&auto=format&fit=crop', // Japan Kyoto pagoda and sunset
  'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=800&auto=format&fit=crop', // Smooth vibrant abstract red/orange gradient
  'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=800&auto=format&fit=crop', // Minimalist laptop workspace desk
];

export function CoverPicker({ current, onChange, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('images');

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 49 }} onClick={onClose} />
      <div className="cover-picker" style={{ zIndex: 50 }}>
        <div className="cover-picker-tabs">
          <button
            className={`cover-picker-tab ${tab === 'images' ? 'active' : ''}`}
            onClick={() => setTab('images')}
          >
            Images
          </button>
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

        {tab === 'images' && (
          <div className="cover-grid">
            {COVER_IMAGES.map((img) => (
              <div
                key={img}
                className={`cover-swatch ${current?.value === img ? 'selected' : ''}`}
                style={{ background: `url(${img}) center/cover no-repeat` }}
                onClick={() => onChange({ type: 'url', value: img, position: 50 })}
              />
            ))}
          </div>
        )}

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
