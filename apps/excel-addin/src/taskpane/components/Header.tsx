import { Button, makeStyles, Text, tokens } from '@fluentui/react-components';
import { WeatherMoonRegular, WeatherSunnyRegular } from '@fluentui/react-icons';
import type { ThemeMode } from '../theme/useOfficeTheme';

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
});

export function Header({ mode, onToggleTheme }: { mode: ThemeMode; onToggleTheme: () => void }): JSX.Element {
  const styles = useStyles();
  return (
    <header className={styles.root}>
      <div className={styles.titles}>
        <Text className={styles.title} size={400}>
          🧠 Formula in Action
        </Text>
        <Text className={styles.subtitle} size={200}>
          Understand your Excel formulas
        </Text>
      </div>
      <Button
        appearance="subtle"
        icon={mode === 'dark' ? <WeatherSunnyRegular /> : <WeatherMoonRegular />}
        aria-label={mode === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
        onClick={onToggleTheme}
      />
    </header>
  );
}
