import type { ExplanationContext } from '@formula-in-action/shared-types';
import { makeStyles, Text, tokens } from '@fluentui/react-components';
import { CONTEXT_VALUES } from '../constants';
import { useTranslation } from '../i18n';
import { NativeSelect } from './NativeSelect';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalL}`,
  },
  label: { color: tokens.colorNeutralForeground3, whiteSpace: 'nowrap' },
  select: { minWidth: '150px' },
});

export function ContextPicker({
  value,
  onChange,
}: {
  value: ExplanationContext;
  onChange: (context: ExplanationContext) => void;
}): JSX.Element {
  const styles = useStyles();
  const t = useTranslation();

  return (
    <div className={styles.root}>
      <Text size={200} className={styles.label}>
        {t.context.pickerLabel}
      </Text>
      <NativeSelect
        className={styles.select}
        value={value}
        onChange={onChange}
        ariaLabel={t.context.pickerLabel}
        options={CONTEXT_VALUES.map((context) => ({ value: context, label: t.context.options[context] }))}
      />
    </div>
  );
}
