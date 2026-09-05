import type { ExplanationContext } from '@formula-in-action/shared-types';
import { Dropdown, makeStyles, Option, Text, tokens } from '@fluentui/react-components';
import { CONTEXT_VALUES } from '../constants';
import { useTranslation } from '../i18n';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalL}`,
  },
  label: { color: tokens.colorNeutralForeground3, whiteSpace: 'nowrap' },
  dropdown: { minWidth: '150px' },
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
      <Dropdown
        className={styles.dropdown}
        size="small"
        value={t.context.options[value] ?? ''}
        selectedOptions={[value]}
        onOptionSelect={(_e, data) => {
          if (data.optionValue) onChange(data.optionValue as ExplanationContext);
        }}
      >
        {CONTEXT_VALUES.map((context) => (
          <Option key={context} value={context} text={t.context.options[context]}>
            {t.context.options[context]}
          </Option>
        ))}
      </Dropdown>
    </div>
  );
}
