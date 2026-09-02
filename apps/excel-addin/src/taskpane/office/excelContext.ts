/* global Excel */

export type SelectionStatus =
  | 'loading'
  | 'ok'
  | 'no-selection'
  | 'no-formula'
  | 'multiple-cells'
  | 'error';

export interface SelectionSnapshot {
  status: SelectionStatus;
  /** Present when status === 'ok'. Includes the leading '='. */
  formula?: string;
  cellAddress?: string;
  sheetNames: string[];
  namedRanges: string[];
  /** Human-readable detail when status === 'error'. */
  message?: string;
}

const EMPTY: SelectionSnapshot = { status: 'loading', sheetNames: [], namedRanges: [] };

/**
 * Read the formula of the currently selected cell plus the workbook metadata the
 * API needs for context. Never reads cell values.
 */
export async function readSelectedFormula(): Promise<SelectionSnapshot> {
  try {
    return await Excel.run(async (context) => {
      const range = context.workbook.getSelectedRange();
      range.load(['formulas', 'address', 'cellCount']);

      const worksheets = context.workbook.worksheets;
      worksheets.load('items/name');
      const names = context.workbook.names;
      names.load('items/name');

      await context.sync();

      const sheetNames = worksheets.items.map((s) => s.name).slice(0, 64);
      const namedRanges = names.items.map((n) => n.name).slice(0, 256);
      const base: SelectionSnapshot = { status: 'ok', sheetNames, namedRanges };

      if (range.cellCount === 0) {
        return { ...base, status: 'no-selection' };
      }
      if (range.cellCount > 1) {
        return { ...base, status: 'multiple-cells' };
      }

      const formula = firstFormula(range.formulas);
      if (typeof formula === 'string' && formula.trim().startsWith('=')) {
        return { ...base, formula: formula.trim(), cellAddress: range.address };
      }
      return { ...base, status: 'no-formula', cellAddress: range.address };
    });
  } catch (error) {
    return {
      ...EMPTY,
      status: 'error',
      message: error instanceof Error ? error.message : 'Could not read the selection.',
    };
  }
}

function firstFormula(formulas: unknown): string | undefined {
  if (Array.isArray(formulas) && Array.isArray(formulas[0])) {
    const value = (formulas as unknown[][])[0]?.[0];
    return typeof value === 'string' ? value : undefined;
  }
  return undefined;
}

/**
 * Subscribe to selection changes. Returns an unsubscribe function.
 * Errors from the subscription are swallowed (the pane still works without it).
 */
export function onSelectionChanged(handler: () => void): () => void {
  let remove: (() => Promise<void>) | undefined;

  void Excel.run(async (context) => {
    const registration = context.workbook.onSelectionChanged.add(async () => {
      handler();
    });
    await context.sync();
    remove = async () =>
      Excel.run(async (ctx) => {
        registration.remove();
        await ctx.sync();
      });
  }).catch(() => {
    /* selection events unavailable — ignore */
  });

  return () => {
    void remove?.();
  };
}
