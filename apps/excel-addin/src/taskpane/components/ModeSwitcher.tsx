import type { ExplanationMode } from '@formula-in-action/shared-types';
import { makeStyles, TabList, Tab, tokens } from '@fluentui/react-components';
import { MODE_VALUES } from '../constants';
import { useTranslation } from '../i18n';

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
  const t = useTranslation();
  return (
    <div className={styles.root}>
      <TabList
        size="small"
        selectedValue={value}
        onTabSelect={(_e, data) => onChange(data.value as ExplanationMode)}
      >
        {MODE_VALUES.map((mode) => (
          <Tab key={mode} value={mode} title={t.mode.options[mode].hint}>
            {t.mode.options[mode].label}
          </Tab>
        ))}
      </TabList>
    </div>
  );
}
