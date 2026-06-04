type BackButtonHandler = () => boolean | void;

const handlers: BackButtonHandler[] = [];

/**
 * Registers a callback to be executed when the hardware back button is pressed.
 * Handlers are executed in reverse order of registration (LIFO - Last In First Out).
 * If a handler returns true, it signifies that the back button action was consumed (e.g. closed a modal),
 * preventing downstream handlers from running.
 * 
 * Returns an unregister function.
 */
export function registerBackButtonHandler(handler: BackButtonHandler): () => void {
  handlers.push(handler);
  return () => {
    const index = handlers.indexOf(handler);
    if (index !== -1) {
      handlers.splice(index, 1);
    }
  };
}

/**
 * Executes registered back button handlers.
 * Returns true if the back button event was handled and consumed, false otherwise.
 */
export function handleBackButton(): boolean {
  for (let i = handlers.length - 1; i >= 0; i--) {
    const isConsumed = handlers[i]();
    if (isConsumed) {
      return true;
    }
  }
  return false;
}
