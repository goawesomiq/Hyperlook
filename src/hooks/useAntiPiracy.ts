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
      // Print screen
      if (e.key === 'PrintScreen') {
        navigator.clipboard.writeText('Screenshots are disabled.');
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
      
      // Ctrl+Shift+I / Cmd+Option+I (DevTools) - Note: won't stop everyone but stops casuals
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'C' || e.key === 'c' || e.key === 'J' || e.key === 'j')) {
        e.preventDefault();
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('dragstart', handleDragStart);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('dragstart', handleDragStart);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
}
