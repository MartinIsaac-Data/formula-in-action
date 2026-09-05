import { Button, makeStyles, Text, tokens } from '@fluentui/react-components';
import { WeatherMoonRegular, WeatherSunnyRegular } from '@fluentui/react-icons';
import { useTranslation, type ExplanationLanguage } from '../i18n';
import type { ThemeMode } from '../theme/useOfficeTheme';
import { SettingsMenu } from './SettingsMenu';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalM,
    padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalL}`,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  titles: { display: 'flex', flexDirection: 'column' },
  title: { fontWeight: tokens.fontWeightSemibold },
  subtitle: { color: tokens.colorNeutralForeground3 },
  actions: { display: 'flex', alignItems: 'center' },
});

export function Header({
  mode,
  onToggleTheme,
  telemetryEnabled,
  onTelemetryChange,
  explanationLanguage,
  onExplanationLanguageChange,
}: {
  mode: ThemeMode;
  onToggleTheme: () => void;
  telemetryEnabled: boolean;
  onTelemetryChange: (enabled: boolean) => void;
  explanationLanguage: ExplanationLanguage;
  onExplanationLanguageChange: (language: ExplanationLanguage) => void;
}): JSX.Element {
  const styles = useStyles();
  const t = useTranslation();
  return (
    <header className={styles.root}>
      <div className={styles.titles}>
        <Text className={styles.title} size={400}>
          🧠 Formula in Action
        </Text>
        <Text className={styles.subtitle} size={200}>
          {t.header.subtitle}
        </Text>
      </div>
      <div className={styles.actions}>
        <SettingsMenu
          telemetryEnabled={telemetryEnabled}
          onTelemetryChange={onTelemetryChange}
          explanationLanguage={explanationLanguage}
          onExplanationLanguageChange={onExplanationLanguageChange}
        />
        <Button
          appearance="subtle"
          icon={mode === 'dark' ? <WeatherSunnyRegular /> : <WeatherMoonRegular />}
          aria-label={mode === 'dark' ? t.header.themeToLight : t.header.themeToDark}
          onClick={onToggleTheme}
        />
      </div>
    </header>
  );
}
