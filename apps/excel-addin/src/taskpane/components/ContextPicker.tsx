import type { ExplanationContext } from '@formula-in-action/shared-types';
import { Dropdown, makeStyles, Option, Text, tokens } from '@fluentui/react-components';
import { CONTEXT_OPTIONS } from '../constants';

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
  const selected = CONTEXT_OPTIONS.find((o) => o.value === value);

  return (
    <div className={styles.root}>
      <Text size={200} className={styles.label}>
        Example context
      </Text>
      <Dropdown
        className={styles.dropdown}
        size="small"
        value={selected?.label ?? ''}
        selectedOptions={[value]}
        onOptionSelect={(_e, data) => {
          if (data.optionValue) onChange(data.optionValue as ExplanationContext);
        }}
      >
        {CONTEXT_OPTIONS.map((option) => (
          <Option key={option.value} value={option.value} text={option.label}>
            {option.label}
          </Option>
        ))}
      </Dropdown>
    </div>
  );
}
