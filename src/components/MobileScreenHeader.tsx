import { ChevronLeft } from 'lucide-react';
import { useIsMobile } from '../utils/useIsMobile';

interface Props {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
}

export function MobileScreenHeader({ title, subtitle, onBack, right }: Props) {
  const isMobile = useIsMobile();
  if (!isMobile) return null;

  return (
    <header className="mobile-screen-header">
      <div className="mobile-screen-header-leading">
        {onBack ? (
          <button type="button" className="mobile-header-btn" onClick={onBack} aria-label="Go back">
            <ChevronLeft size={22} />
          </button>
        ) : (
          <span className="mobile-header-spacer" />
        )}
      </div>
      <div className="mobile-screen-header-center">
        <h1 className="mobile-screen-header-title">{title}</h1>
        {subtitle && <p className="mobile-screen-header-subtitle">{subtitle}</p>}
      </div>
      <div className="mobile-screen-header-trailing">
        {right ?? <span className="mobile-header-spacer" />}
      </div>
    </header>
  );
}
