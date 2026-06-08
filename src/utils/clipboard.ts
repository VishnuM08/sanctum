/**
 * Copies text to the clipboard using the modern navigator.clipboard API if available,
 * with a fallback to the older document.execCommand('copy') for non-secure contexts
 * or webviews (like Capacitor Android/iOS) where navigator.clipboard might be undefined.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  // Try modern navigator.clipboard API first
  if (navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn('navigator.clipboard.writeText failed, trying fallback:', err);
    }
  }

  // Fallback to document.execCommand('copy')
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    
    // Prevent scrolling and position off-screen
    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.width = '2em';
    textArea.style.height = '2em';
    textArea.style.padding = '0';
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';
    textArea.style.background = 'transparent';
    
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    
    if (successful) {
      return true;
    } else {
      throw new Error('execCommand returned false');
    }
  } catch (err) {
    console.error('Fallback clipboard copy failed:', err);
    return false;
  }
}
