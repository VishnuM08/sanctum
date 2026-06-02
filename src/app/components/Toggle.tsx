import { clsx } from 'clsx';

interface ToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  label: string;
  description?: string;
}

export function Toggle({ enabled, onChange, label, description }: ToggleProps) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-accent/50 hover:bg-accent transition-colors">
      <div className="flex-1">
        <h4 className="font-medium mb-1">{label}</h4>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={clsx(
          'relative w-14 h-7 rounded-full transition-all duration-300',
          enabled
            ? 'bg-primary shadow-lg shadow-primary/30'
            : 'bg-muted'
        )}
      >
        <div
          className={clsx(
            'absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 transform',
            enabled ? 'translate-x-8' : 'translate-x-1'
          )}
        />
      </button>
    </div>
  );
}
