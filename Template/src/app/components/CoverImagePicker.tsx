import { useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { clsx } from 'clsx';

interface CoverImagePickerProps {
  currentCover: string;
  onSelect: (cover: string) => void;
}

const COVER_IMAGES = [
  'https://images.unsplash.com/photo-1522383225653-ed111181a951?w=1200&h=400&fit=crop',
  'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=1200&h=400&fit=crop',
  'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&h=400&fit=crop',
  'https://images.unsplash.com/photo-1557683316-973673baf926?w=1200&h=400&fit=crop',
  'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=1200&h=400&fit=crop',
  'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&h=400&fit=crop',
  'https://images.unsplash.com/photo-1563089145-599997674d42?w=1200&h=400&fit=crop',
  'https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?w=1200&h=400&fit=crop',
  'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200&h=400&fit=crop',
  'https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=1200&h=400&fit=crop',
  'https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?w=1200&h=400&fit=crop',
  'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&h=400&fit=crop',
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&h=400&fit=crop',
];

export function CoverImagePicker({ currentCover, onSelect }: CoverImagePickerProps) {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <div className="relative group">
      <div className="relative h-60 overflow-hidden rounded-t-2xl">
        <img
          src={currentCover}
          alt="Cover"
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />

        <button
          onClick={() => setShowPicker(!showPicker)}
          className="absolute bottom-4 right-4 px-4 py-2 bg-white/90 hover:bg-white text-gray-900 rounded-lg opacity-0 group-hover:opacity-100 transition-all flex items-center gap-2 backdrop-blur-sm shadow-lg"
        >
          <ImageIcon className="w-4 h-4" />
          <span className="text-sm font-medium">Change Cover</span>
        </button>
      </div>

      {showPicker && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowPicker(false)}
          />
          <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-xl z-50 p-4">
            <p className="text-sm font-medium mb-3">Select Cover Image</p>
            <div className="grid grid-cols-3 gap-3">
              {COVER_IMAGES.map((image, index) => (
                <button
                  key={index}
                  onClick={() => {
                    onSelect(image);
                    setShowPicker(false);
                  }}
                  className={clsx(
                    "relative h-20 rounded-lg overflow-hidden hover:ring-2 hover:ring-primary transition-all",
                    currentCover === image && "ring-2 ring-primary"
                  )}
                >
                  <img
                    src={image}
                    alt={`Cover ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
