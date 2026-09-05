import {
  Button,
  Link,
  makeStyles,
  Popover,
  PopoverSurface,
  PopoverTrigger,
  Switch,
  Text,
  tokens,
} from '@fluentui/react-components';
import { SettingsRegular } from '@fluentui/react-icons';
import { API_BASE_URL } from '../services/apiClient';

function apiHost(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

const useStyles = makeStyles({
  surface: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    width: '260px',
  },
  detail: { color: tokens.colorNeutralForeground3 },
});

export function SettingsMenu({
  telemetryEnabled,
  onTelemetryChange,
}: {
  telemetryEnabled: boolean;
  onTelemetryChange: (enabled: boolean) => void;
}): JSX.Element {
  const styles = useStyles();

  return (
    <Popover positioning="below-end">
      <PopoverTrigger disableButtonEnhancement>
        <Button appearance="subtle" icon={<SettingsRegular />} aria-label="Settings" />
      </PopoverTrigger>
      <PopoverSurface className={styles.surface}>
        <Text weight="semibold">Privacy</Text>
        <Switch
          checked={telemetryEnabled}
          onChange={(_e, data) => onTelemetryChange(data.checked)}
          label="Share anonymous usage stats"
        />
        <Text size={200} className={styles.detail}>
          Only the explanation mode, context, and whether it succeeded — never your formula
          or cell values. Off by default.
        </Text>
        <Text size={200} className={styles.detail}>
          Formulas are sent to {apiHost(API_BASE_URL)} for analysis, never stored.
        </Text>
        <Link href="./privacy.html" target="_blank" rel="noreferrer">
          Privacy statement
        </Link>
      </PopoverSurface>
    </Popover>
  );
}
