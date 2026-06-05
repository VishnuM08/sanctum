import { useState, useEffect, useRef } from 'react';
import { useStore } from '../store';
import { ChevronRight, ChevronLeft, X, Sparkles, Plus, ShieldCheck, Bot, Edit3 } from 'lucide-react';

interface Step {
  title: string;
  description: string;
  selector: string;
  placement: 'right' | 'left' | 'top' | 'bottom' | 'center';
  viewType?: 'page' | 'vault' | 'agent' | 'home';
  icon: React.ReactNode;
}

export function OnboardingTour() {
  const [currentStep, setCurrentStep] = useState<number>(-1);
  const activeView = useStore((s) => s.activeView);
  const pages = useStore((s) => s.pages);
  const sidebarCollapsed = useStore((s) => s.sidebarCollapsed);
  const [highlightStyle, setHighlightStyle] = useState<React.CSSProperties>({});
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Initialize steps list
  const steps: Step[] = [
    {
      title: 'Welcome to Notebook! 👋',
      description: 'Notebook is your secure, locally-encrypted workspace. Let\'s take a quick 1-minute tour to see how to make the most of it.',
      selector: '.page-cover',
      placement: 'center',
      viewType: 'page',
      icon: <Sparkles size={20} style={{ color: 'var(--accent)' }} />,
    },
    {
      title: 'Create Your First Note',
      description: 'Click this button in the sidebar to create a new page. You can customize icons, cover designs, and structure nested pages.',
      selector: '#tour-add-page',
      placement: 'right',
      viewType: 'page',
      icon: <Plus size={20} style={{ color: 'var(--accent)' }} />,
    },
    {
      title: 'Rich Editor & Slash Commands',
      description: 'Click anywhere inside the document and type "/" to trigger the Slash Commands menu. Instantly insert headings, lists, dynamic databases, and callouts.',
      selector: '.ProseMirror',
      placement: 'top',
      viewType: 'page',
      icon: <Edit3 size={20} style={{ color: 'var(--accent)' }} />,
    },
    {
      title: 'Zero-Knowledge Security Vault',
      description: 'Go to the Vault section to configure your master encryption key. All passwords, cards, files, and notes in the vault are encrypted locally on your device before syncing.',
      selector: '#tour-vault',
      placement: 'right',
      viewType: 'vault',
      icon: <ShieldCheck size={20} style={{ color: 'var(--accent)' }} />,
    },
    {
      title: 'Private AI Co-Pilot',
      description: 'Ask the AI Agent in the sidebar to summarize your pages, generate new content, or audit logs. All processing runs privately on your server using Ollama.',
      selector: '#tour-agent',
      placement: 'right',
      viewType: 'agent',
      icon: <Bot size={20} style={{ color: 'var(--accent)' }} />,
    },
  ];

  // Start tour if the user is logging in for the first time
  useEffect(() => {
    const tourCompleted = localStorage.getItem('notebook_tour_completed');
    if (!tourCompleted) {
      // Small delay to let the app initialize and fetch notes
      const timer = setTimeout(() => {
        setCurrentStep(0);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  // Sync view navigation and sidebar state with the current tour step
  useEffect(() => {
    if (currentStep < 0 || currentStep >= steps.length) return;
    const step = steps[currentStep];

    // 1. Navigate to the right view type if needed
    if (step.viewType) {
      if (step.viewType === 'page') {
        const onboardingPage = pages.find((p) => p.tags?.includes('onboarding')) || pages[0];
        if (onboardingPage && activeView.type !== 'page') {
          useStore.setState({ activeView: { type: 'page', id: onboardingPage.id } });
        }
      } else if (activeView.type !== step.viewType) {
        useStore.setState({ activeView: { type: step.viewType } });
      }
    }

    // 2. Open sidebar if highlighting a sidebar element
    if (step.selector.startsWith('#tour-') && sidebarCollapsed) {
      useStore.setState({ sidebarCollapsed: false });
    }
  }, [currentStep, activeView.type, pages]);

  // Recalculate target position on step changes, window resize, or sidebar state transitions
  // Recalculate target position on step changes, window resize, or sidebar state transitions
  useEffect(() => {
    if (currentStep < 0 || currentStep >= steps.length) {
      setHighlightStyle({ display: 'none' });
      return;
    }

    const step = steps[currentStep];

    // Keep track of the currently styled target element and its original inline styles
    let lastElement: HTMLElement | null = null;
    let origPosition = '';
    let origZIndex = '';
    let origPointerEvents = '';

    const restoreElementStyles = () => {
      if (lastElement) {
        lastElement.style.position = origPosition;
        lastElement.style.zIndex = origZIndex;
        lastElement.style.pointerEvents = origPointerEvents;
        lastElement.classList.remove('tour-active-target');
        lastElement = null;
      }
    };

    const updatePosition = () => {
      const element = document.querySelector(step.selector) as HTMLElement | null;

      // If the target element has changed, restore the old one and style the new one
      if (element !== lastElement) {
        restoreElementStyles();
        if (element) {
          lastElement = element;
          origPosition = element.style.position;
          origZIndex = element.style.zIndex;
          origPointerEvents = element.style.pointerEvents;

          const computedStyle = window.getComputedStyle(element);
          if (computedStyle.position === 'static') {
            element.style.position = 'relative';
          }
          element.style.zIndex = '99999';
          element.style.pointerEvents = 'auto';
          element.classList.add('tour-active-target');
        }
      }

      if (!element) {
        // Fallback if target element is temporarily hidden or loading: center the spotlight/tooltip
        setHighlightStyle({
          position: 'fixed',
          left: '50%',
          top: '50%',
          width: '0px',
          height: '0px',
          boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
          zIndex: 99999,
        });

        if (window.innerWidth <= 768) {
          setTooltipStyle({
            position: 'fixed',
            left: '16px',
            right: '16px',
            bottom: '16px',
            transform: 'none',
            zIndex: 100000,
            transition: 'all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)',
          });
        } else {
          setTooltipStyle({
            position: 'fixed',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 100000,
            transition: 'all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)',
          });
        }
        return;
      }

      const rect = element.getBoundingClientRect();

      // Spotlight ring overlay style
      setHighlightStyle({
        position: 'fixed',
        left: `${rect.left}px`,
        top: `${rect.top}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`,
        border: '2px solid var(--accent)',
        borderRadius: '6px',
        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5), 0 0 12px var(--accent)',
        zIndex: 99999,
        pointerEvents: 'none',
        transition: 'all 0.15s cubic-bezier(0.2, 0.8, 0.2, 1)',
      });

      // Tooltip position calculation
      if (window.innerWidth <= 768) {
        // Mobile bottom sheet layout
        setTooltipStyle({
          position: 'fixed',
          left: '16px',
          right: '16px',
          bottom: '16px',
          transform: 'none',
          zIndex: 100000,
          transition: 'all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)',
        });
      } else {
        const tooltipMargin = 16;
        let left = 0;
        let top = 0;
        let transform = '';

        if (step.placement === 'center') {
          left = window.innerWidth / 2;
          top = window.innerHeight / 2;
          transform = 'translate(-50%, -50%)';
        } else if (step.placement === 'right') {
          left = rect.right + tooltipMargin;
          top = rect.top + rect.height / 2;
          transform = 'translateY(-50%)';
          // Bounds checking
          if (tooltipRef.current && left + tooltipRef.current.offsetWidth > window.innerWidth) {
            left = rect.left - tooltipRef.current.offsetWidth - tooltipMargin;
          }
        } else if (step.placement === 'left') {
          left = rect.left - tooltipMargin;
          top = rect.top + rect.height / 2;
          transform = 'translate(-100%, -50%)';
        } else if (step.placement === 'top') {
          left = rect.left + rect.width / 2;
          top = rect.top - tooltipMargin;
          transform = 'translate(-50%, -100%)';
        } else if (step.placement === 'bottom') {
          left = rect.left + rect.width / 2;
          top = rect.bottom + tooltipMargin;
          transform = 'translate(-50%, 0)';
        }

        // Ensure tooltip remains visible inside viewport boundaries
        if (left < tooltipMargin) left = tooltipMargin;
        if (top < tooltipMargin) top = tooltipMargin;

        setTooltipStyle({
          position: 'fixed',
          left: `${left}px`,
          top: `${top}px`,
          transform,
          zIndex: 100000,
          transition: 'all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)',
        });
      }
    };

    // Run positioning immediately and poll during transition (600ms window)
    updatePosition();
    const interval = setInterval(updatePosition, 30);
    const timeout = setTimeout(() => clearInterval(interval), 600);

    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true); // capture phase to listen to any scrolling sub-container

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
      restoreElementStyles();
    };
  }, [currentStep, sidebarCollapsed]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem('notebook_tour_completed', 'true');
    setCurrentStep(-1);
    // Auto collapse sidebar on mobile after completion
    if (window.innerWidth <= 768) {
      useStore.setState({ sidebarCollapsed: true });
    }
  };

  if (currentStep < 0) return null;

  const step = steps[currentStep];

  return (
    <>
      {/* Click blocker backdrop that prevents any user interaction with the application during the tour */}
      <div className="tour-backdrop" />

      {/* Dynamic spotlight highlight overlay */}
      <div style={highlightStyle} />

      {/* Floating tooltip block */}
      <div
        ref={tooltipRef}
        className="tour-tooltip"
        style={tooltipStyle}
      >
        <button
          className="tour-close-btn"
          onClick={handleComplete}
          title="Skip tour"
        >
          <X size={14} />
        </button>

        <div className="tour-content">
          <div className="tour-header">
            <span className="tour-icon">{step.icon}</span>
            <h4 className="tour-title">{step.title}</h4>
          </div>
          <p className="tour-desc">{step.description}</p>
        </div>

        <div className="tour-footer">
          <div className="tour-progress">
            {steps.map((_, i) => (
              <span
                key={i}
                className={`tour-dot ${i === currentStep ? 'active' : ''}`}
                onClick={() => setCurrentStep(i)}
              />
            ))}
          </div>

          <div className="tour-actions">
            {currentStep > 0 && (
              <button className="tour-btn secondary" onClick={handleBack}>
                <ChevronLeft size={16} style={{ marginRight: 4 }} /> Back
              </button>
            )}
            <button className="tour-btn primary" onClick={handleNext}>
              {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
              {currentStep < steps.length - 1 && <ChevronRight size={16} style={{ marginLeft: 4 }} />}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
