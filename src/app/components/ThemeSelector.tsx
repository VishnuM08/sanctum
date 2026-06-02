import { useTheme } from '../context/ThemeContext';
import { Check } from 'lucide-react';
import { clsx } from 'clsx';

const themes = [
  { id: 'indigo', name: 'Indigo', color: '#6366f1' },
  { id: 'emerald', name: 'Emerald', color: '#10b981' },
  { id: 'rose', name: 'Rose', color: '#f43f5e' },
  { id: 'sakura', name: 'Sakura (Pink)', color: '#ff8da1' },
  { id: 'amber', name: 'Amber', color: '#f59e0b' },
  { id: 'cyan', name: 'Cyan', color: '#06b6d4' },
  { id: 'purple', name: 'Purple', color: '#a855f7' },
] as const;

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  return (
    <div>
      <label className="text-sm font-medium text-foreground mb-3 block">Theme Color</label>
      <div className="grid grid-cols-3 gap-3">
        {themes.map((t) => (
          <button
            key={t.id}
            onClick={() => setTheme(t.id as any)}
            className={clsx(
              'relative p-4 rounded-xl border-2 transition-all hover:scale-105 active:scale-95',
              theme === t.id
                ? 'border-primary shadow-lg shadow-primary/30'
                : 'border-border hover:border-primary/50'
            )}
            style={{
              background: theme === t.id
                ? `linear-gradient(135deg, ${t.color}10, ${t.color}20)`
                : 'transparent'
            }}
          >
            <div
              className="w-8 h-8 rounded-lg mx-auto mb-2 shadow-md"
              style={{ background: t.color }}
            />
            <p className="text-xs font-medium text-center">{t.name}</p>
            {theme === t.id && (
              <div
                className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center animate-in bounce-in"
                style={{ background: t.color }}
              >
                <Check className="w-3 h-3 text-white" />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
