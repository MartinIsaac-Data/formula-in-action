import type { ExplanationMode } from '@formula-in-action/shared-types';
import { makeStyles, TabList, Tab, tokens } from '@fluentui/react-components';
import { MODE_OPTIONS } from '../constants';

const useStyles = makeStyles({
  root: { padding: `0 ${tokens.spacingHorizontalL}` },
});

export function ModeSwitcher({
  value,
  onChange,
}: {
  value: ExplanationMode;
  onChange: (mode: ExplanationMode) => void;
}): JSX.Element {
  const styles = useStyles();
  return (
    <div className={styles.root}>
      <TabList
        size="small"
        selectedValue={value}
        onTabSelect={(_e, data) => onChange(data.value as ExplanationMode)}
      >
        {MODE_OPTIONS.map((option) => (
          <Tab key={option.value} value={option.value} title={option.hint}>
            {option.label}
          </Tab>
        ))}
      </TabList>
    </div>
  );
}
