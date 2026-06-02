import { useState } from 'react';

interface IconPickerProps {
  currentIcon: string;
  onSelect: (icon: string) => void;
}

const EMOJI_ICONS = [
  '📝', '📖', '📚', '📔', '📓', '📕', '📗', '📘', '📙',
  '💡', '✨', '🌟', '⭐', '🔥', '💫', '🎯', '🎨', '🎭',
  '🌸', '🌺', '🌼', '🌻', '🌷', '🌹', '🏵️', '💐', '🌿',
  '🦋', '🐝', '🌈', '☀️', '🌙', '⚡', '💎', '🔮', '🎪',
  '🎡', '🎢', '🎠', '🎨', '🖌️', '✏️', '📌', '📍', '🔖'
];

export function IconPicker({ currentIcon, onSelect }: IconPickerProps) {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setShowPicker(!showPicker)}
        className="text-6xl hover:scale-110 transition-transform"
      >
        {currentIcon}
      </button>

      {showPicker && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowPicker(false)}
          />
          <div className="absolute top-full left-0 mt-2 bg-card border border-border rounded-xl shadow-xl z-50 p-4 w-80">
            <p className="text-sm font-medium mb-3">Select Icon</p>
            <div className="grid grid-cols-8 gap-2">
              {EMOJI_ICONS.map((emoji, index) => (
                <button
                  key={index}
                  onClick={() => {
                    onSelect(emoji);
                    setShowPicker(false);
                  }}
                  className="text-3xl hover:bg-accent rounded-lg p-2 transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
