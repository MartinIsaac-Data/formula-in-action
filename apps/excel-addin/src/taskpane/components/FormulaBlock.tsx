import { makeStyles, Text, tokens } from '@fluentui/react-components';
import { useTranslation } from '../i18n';
import { CopyButton } from './actions/CopyButton';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
    padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalL}`,
  },
  labelRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  label: {
    color: tokens.colorNeutralForeground3,
    fontWeight: tokens.fontWeightSemibold,
    letterSpacing: '0.04em',
  },
  code: {
    fontFamily: tokens.fontFamilyMonospace,
    fontSize: tokens.fontSizeBase300,
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingHorizontalM,
    overflowX: 'auto',
    whiteSpace: 'pre',
  },
});

export function FormulaBlock({
  formula,
  cellAddress,
}: {
  formula: string;
  cellAddress?: string;
}): JSX.Element {
  const styles = useStyles();
  const t = useTranslation();
  return (
    <section className={styles.root}>
      <div className={styles.labelRow}>
        <Text className={styles.label} size={100}>
          {t.formula.label}
          {cellAddress ? ` · ${cellAddress}` : ''}
        </Text>
        <CopyButton value={formula} label={t.formula.copyLabel} />
      </div>
      <pre className={styles.code}>{formula}</pre>
    </section>
  );
}
