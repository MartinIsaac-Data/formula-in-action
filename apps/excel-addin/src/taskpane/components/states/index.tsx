import { Button, makeStyles, Spinner, Text, tokens } from '@fluentui/react-components';
import { useTranslation } from '../../i18n';
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
    <div className={styles.root} role="status" aria-live="polite">
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
  const t = useTranslation();
  return (
    <div className={styles.root} role="alert">
      <Text weight="semibold">{title}</Text>
      {detail ? (
        <Text size={200} className={styles.detail}>
          {detail}
        </Text>
      ) : null}
      {onRetry ? (
        <Button appearance="primary" onClick={onRetry}>
          {t.state.tryAgain}
        </Button>
      ) : null}
    </div>
  );
}

export function EmptyState({
  status,
}: {
  status: Exclude<SelectionStatus, 'ok' | 'loading' | 'error'>;
}): JSX.Element {
  const styles = useStyles();
  const t = useTranslation();
  const detail: Record<typeof status, string> = {
    'no-selection': t.state.noSelection,
    'no-formula': t.state.noFormula,
    'multiple-cells': t.state.multipleCells,
  };
  return (
    <div className={styles.root} role="status" aria-live="polite">
      <Text size={500} aria-hidden>
        🧮
      </Text>
      <Text weight="semibold">{t.state.emptyTitle}</Text>
      <Text size={200} className={styles.detail}>
        {detail[status]}
      </Text>
    </div>
  );
}
