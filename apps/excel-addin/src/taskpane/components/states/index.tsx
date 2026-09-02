import { Button, makeStyles, Spinner, Text, tokens } from '@fluentui/react-components';
import type { SelectionStatus } from '../../office/excelContext';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacingVerticalM,
    textAlign: 'center',
    padding: tokens.spacingHorizontalXXL,
    minHeight: '160px',
  },
  detail: { color: tokens.colorNeutralForeground3, maxWidth: '260px' },
});

export function LoadingState({ label }: { label: string }): JSX.Element {
  const styles = useStyles();
  return (
    <div className={styles.root}>
      <Spinner label={label} />
    </div>
  );
}

export function ErrorState({
  title,
  detail,
  onRetry,
}: {
  title: string;
  detail?: string;
  onRetry?: () => void;
}): JSX.Element {
  const styles = useStyles();
  return (
    <div className={styles.root}>
      <Text weight="semibold">{title}</Text>
      {detail ? (
        <Text size={200} className={styles.detail}>
          {detail}
        </Text>
      ) : null}
      {onRetry ? (
        <Button appearance="primary" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}

const SELECTION_COPY: Record<Exclude<SelectionStatus, 'ok' | 'loading' | 'error'>, string> = {
  'no-selection': 'Select a cell to get started.',
  'no-formula': 'The selected cell has a value, not a formula. Pick a cell that starts with “=”.',
  'multiple-cells': 'Select a single cell that contains a formula.',
};

export function EmptyState({
  status,
}: {
  status: Exclude<SelectionStatus, 'ok' | 'loading' | 'error'>;
}): JSX.Element {
  const styles = useStyles();
  return (
    <div className={styles.root}>
      <Text size={500} aria-hidden>
        🧮
      </Text>
      <Text weight="semibold">Nothing to explain yet</Text>
      <Text size={200} className={styles.detail}>
        {SELECTION_COPY[status]}
      </Text>
    </div>
  );
}
