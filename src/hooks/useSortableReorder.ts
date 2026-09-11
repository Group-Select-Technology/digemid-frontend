import { useCallback, useRef, useState, type DragEvent } from 'react';

/**
 * Reordenamiento por arrastre (HTML5). `onReorder(from, to)` inserta el ítem
 * de `from` en la posición `to`, igual que el splice de las flechas.
 */
export function useSortableReorder(enabled: boolean) {
  const fromIndex = useRef<number | null>(null);
  const overIndexRef = useRef<number | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const getItemProps = useCallback(
    (index: number, onReorder: (from: number, to: number) => void) => {
      if (!enabled) return {};

      return {
        draggable: true,
        onDragStart: (event: DragEvent<HTMLElement>) => {
          fromIndex.current = index;
          setDraggingIndex(index);
          event.dataTransfer.effectAllowed = 'move';
          event.dataTransfer.setData('text/plain', String(index));
        },
        onDragOver: (event: DragEvent<HTMLElement>) => {
          event.preventDefault();
          event.dataTransfer.dropEffect = 'move';
          if (overIndexRef.current === index) return;
          overIndexRef.current = index;
          setOverIndex(index);
        },
        onDrop: (event: DragEvent<HTMLElement>) => {
          event.preventDefault();
          const from = fromIndex.current;
          fromIndex.current = null;
          overIndexRef.current = null;
          setDraggingIndex(null);
          setOverIndex(null);
          if (from === null || from === index) return;
          onReorder(from, index);
        },
        onDragEnd: () => {
          fromIndex.current = null;
          overIndexRef.current = null;
          setDraggingIndex(null);
          setOverIndex(null);
        },
      };
    },
    [enabled]
  );

  const itemClassName = (index: number) => {
    const dragging = draggingIndex === index;
    const over = overIndex === index && draggingIndex !== null && draggingIndex !== index;
    return [
      enabled ? 'cursor-grab active:cursor-grabbing' : '',
      dragging ? 'opacity-40' : '',
      over ? 'ring-2 ring-brand-500 ring-offset-2 dark:ring-offset-gray-900' : '',
    ]
      .filter(Boolean)
      .join(' ');
  };

  return { getItemProps, itemClassName };
}
