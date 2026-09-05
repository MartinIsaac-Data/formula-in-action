import {
  Button,
  Dropdown,
  Link,
  makeStyles,
  Option,
  Popover,
  PopoverSurface,
  PopoverTrigger,
  Switch,
  Text,
  tokens,
} from '@fluentui/react-components';
import { SettingsRegular } from '@fluentui/react-icons';
import {
  EXPLANATION_LANGUAGE_NAMES,
  EXPLANATION_LANGUAGE_VALUES,
  useTranslation,
  type ExplanationLanguage,
} from '../i18n';
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
  row: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalS,
  },
});

export function SettingsMenu({
  telemetryEnabled,
  onTelemetryChange,
  explanationLanguage,
  onExplanationLanguageChange,
}: {
  telemetryEnabled: boolean;
  onTelemetryChange: (enabled: boolean) => void;
  explanationLanguage: ExplanationLanguage;
  onExplanationLanguageChange: (language: ExplanationLanguage) => void;
}): JSX.Element {
  const styles = useStyles();
  const t = useTranslation();

  const displayName = (value: ExplanationLanguage): string =>
    value === 'auto' ? t.settings.explanationLanguageAuto : EXPLANATION_LANGUAGE_NAMES[value];

  return (
    <Popover positioning="below-end">
      <PopoverTrigger disableButtonEnhancement>
        <Button appearance="subtle" icon={<SettingsRegular />} aria-label={t.settings.ariaLabel} />
      </PopoverTrigger>
      <PopoverSurface className={styles.surface}>
        <div className={styles.row}>
          <Text weight="semibold">{t.settings.explanationLanguage}</Text>
          <Dropdown
            size="small"
            style={{ minWidth: '150px' }}
            value={displayName(explanationLanguage)}
            selectedOptions={[explanationLanguage]}
            onOptionSelect={(_e, data) => {
              if (data.optionValue) onExplanationLanguageChange(data.optionValue as ExplanationLanguage);
            }}
          >
            {EXPLANATION_LANGUAGE_VALUES.map((value) => (
              <Option key={value} value={value} text={displayName(value)}>
                {displayName(value)}
              </Option>
            ))}
          </Dropdown>
        </div>

        <Text weight="semibold">{t.settings.privacy}</Text>
        <Switch
          checked={telemetryEnabled}
          onChange={(_e, data) => onTelemetryChange(data.checked)}
          label={t.settings.telemetryLabel}
        />
        <Text size={200} className={styles.detail}>
          {t.settings.telemetryDetail}
        </Text>
        <Text size={200} className={styles.detail}>
          {t.settings.apiHostDetail(apiHost(API_BASE_URL))}
        </Text>
        <Link href="./privacy.html" target="_blank" rel="noreferrer">
          {t.settings.privacyStatement}
        </Link>
      </PopoverSurface>
    </Popover>
  );
}
