import { useEffect, useState } from 'react';
import {
  onSelectionChanged,
  readSelectedFormula,
  type SelectionSnapshot,
} from '../office/excelContext';

const INITIAL: SelectionSnapshot = { status: 'loading', sheetNames: [], namedRanges: [] };

/**
 * Tracks the formula in the currently selected cell, re-reading it whenever the
 * selection changes in Excel.
 */
export function useSelectedFormula(): SelectionSnapshot {
  const [snapshot, setSnapshot] = useState<SelectionSnapshot>(INITIAL);

  useEffect(() => {
    let active = true;
    const refresh = (): void => {
      void readSelectedFormula().then((next) => {
        if (active) setSnapshot(next);
      });
    };

    refresh();
    const unsubscribe = onSelectionChanged(refresh);

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  return snapshot;
}
