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
import { LANGUAGE_OPTIONS, useTranslation, type Language } from '../i18n';
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
  row: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: tokens.spacingHorizontalS },
});

export function SettingsMenu({
  telemetryEnabled,
  onTelemetryChange,
  language,
  onLanguageChange,
}: {
  telemetryEnabled: boolean;
  onTelemetryChange: (enabled: boolean) => void;
  language: Language;
  onLanguageChange: (language: Language) => void;
}): JSX.Element {
  const styles = useStyles();
  const t = useTranslation();
  const selectedLanguage = LANGUAGE_OPTIONS.find((o) => o.value === language);

  return (
    <Popover positioning="below-end">
      <PopoverTrigger disableButtonEnhancement>
        <Button appearance="subtle" icon={<SettingsRegular />} aria-label={t.settings.ariaLabel} />
      </PopoverTrigger>
      <PopoverSurface className={styles.surface}>
        <div className={styles.row}>
          <Text weight="semibold">{t.settings.language}</Text>
          <Dropdown
            size="small"
            style={{ minWidth: '120px' }}
            value={selectedLanguage?.label ?? ''}
            selectedOptions={[language]}
            onOptionSelect={(_e, data) => {
              if (data.optionValue) onLanguageChange(data.optionValue as Language);
            }}
          >
            {LANGUAGE_OPTIONS.map((option) => (
              <Option key={option.value} value={option.value} text={option.label}>
                {option.label}
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
