import { useEffect } from 'react';

export function useAntiPiracy() {
  useEffect(() => {
    // 1. Prevent right click context menu (save image as, etc)
    const handleContextMenu = (e: MouseEvent) => {
      // Allow context menu on input fields so users can paste/copy text
      const target = e.target as HTMLElement;
      if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
        e.preventDefault();
      }
    };

    // 2. Prevent drag and drop of images
    const handleDragStart = (e: DragEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'IMG') {
        e.preventDefault();
      }
    };

    // 3. Prevent keyboard shortcuts like PrintScreen, Ctrl+S, Ctrl+P, Mac equivalents
    const handleKeyDown = (e: KeyboardEvent) => {
      // Print screen Windows
      if (e.key === 'PrintScreen') {
        navigator.clipboard.writeText('Screenshots are disabled.');
        document.body.classList.add('screenshot-blur');
        setTimeout(() => document.body.classList.remove('screenshot-blur'), 3000);
        e.preventDefault();
      }
      
      // Mac Screenshot combinations (Cmd+Shift+3, Cmd+Shift+4, Cmd+Shift+5)
      if (e.metaKey && e.shiftKey && (e.key === '3' || e.key === '4' || e.key === '5')) {
        navigator.clipboard.writeText('Screenshots are disabled.');
        document.body.classList.add('screenshot-blur');
        setTimeout(() => document.body.classList.remove('screenshot-blur'), 3000);
        e.preventDefault();
      }
      
      // Ctrl+S / Cmd+S (Save Page)
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
      }
      
      // Ctrl+P / Cmd+P (Print Page)
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
      }
      
      // Ctrl+Shift+I / Cmd+Option+I (DevTools)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'C' || e.key === 'c' || e.key === 'J' || e.key === 'j')) {
        e.preventDefault();
      }
    };

    // 4. Handle Window Blur and Visibility Change
    const setBlur = () => document.body.classList.add('screenshot-blur');
    const removeBlur = () => document.body.classList.remove('screenshot-blur');

    const handleWindowBlur = () => setBlur();
    const handleWindowFocus = () => removeBlur();
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' || document.hidden) {
        setBlur();
      } else {
        removeBlur();
      }
    };

    // 5. Handle clipboard copy event to prevent copying images
    const handleCopy = (e: ClipboardEvent) => {
      const selection = window.getSelection();
      if (selection && selection.toString() === '') {
          e.preventDefault();
          if (e.clipboardData) {
            e.clipboardData.setData('text/plain', 'Copying images is disabled.');
          }
      }
    };
    
    // 6. Mobile specific touch protections 
    const handleTouchStart = (e: TouchEvent) => {
      // Prevent multi-touch gestures that might zoom or do system actions
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    document.addEventListener('contextmenu', handleContextMenu, { capture: true });
    document.addEventListener('dragstart', handleDragStart, { capture: true });
    document.addEventListener('keydown', handleKeyDown, { capture: true });
    document.addEventListener('copy', handleCopy, { capture: true });
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('touchstart', handleTouchStart, { passive: false });

    // Initial check in case window starts unfocused
    if (!document.hasFocus() || document.hidden) {
      setBlur();
    }

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu, { capture: true });
      document.removeEventListener('dragstart', handleDragStart, { capture: true });
      document.removeEventListener('keydown', handleKeyDown, { capture: true });
      document.removeEventListener('copy', handleCopy, { capture: true });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('touchstart', handleTouchStart);
    };
  }, []);
}
