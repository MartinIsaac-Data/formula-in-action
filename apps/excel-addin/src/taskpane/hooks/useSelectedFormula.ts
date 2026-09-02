import { useEffect, useRef, useState } from 'react';
import {
  onSelectionChanged,
  readSelectedFormula,
  type SelectionSnapshot,
} from '../office/excelContext';

const INITIAL: SelectionSnapshot = { status: 'loading', sheetNames: [], namedRanges: [] };
const DEBOUNCE_MS = 250;

/**
 * Tracks the formula in the currently selected cell, re-reading it whenever the
 * selection changes in Excel. Selection-change reads are debounced so holding an
 * arrow key does not trigger a burst of explanation requests.
 */
export function useSelectedFormula(): SelectionSnapshot {
  const [snapshot, setSnapshot] = useState<SelectionSnapshot>(INITIAL);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    let active = true;

    const read = (): void => {
      void readSelectedFormula().then((next) => {
        if (active) setSnapshot(next);
      });
    };

    read();
    const unsubscribe = onSelectionChanged(() => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(read, DEBOUNCE_MS);
    });

    return () => {
      active = false;
      if (timer.current) clearTimeout(timer.current);
      unsubscribe();
    };
  }, []);

  return snapshot;
}
