import type { FormulaHealth, HealthPenalty } from '@formula-in-action/shared-types';
import { Text, makeStyles, tokens } from '@fluentui/react-components';
import { useTranslation } from '../i18n';
import type { Dictionary } from '../i18n';

type DimensionName = keyof FormulaHealth['dimensions'];

const DIMENSION_ORDER: DimensionName[] = [
  'reliability',
  'readability',
  'performance',
  'maintainability',
];

const BAND_COLOR: Record<FormulaHealth['band'], string> = {
  excellent: tokens.colorPaletteGreenForeground1,
  good: tokens.colorPaletteGreenForeground1,
  fair: tokens.colorPaletteYellowForeground1,
  poor: tokens.colorPaletteRedForeground1,
};

const useStyles = makeStyles({
  card: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    padding: tokens.spacingHorizontalM,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground2,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  headline: {
    display: 'flex',
    alignItems: 'baseline',
    gap: tokens.spacingHorizontalS,
  },
  score: {
    fontSize: tokens.fontSizeHero800,
    fontWeight: tokens.fontWeightBold,
    lineHeight: '1',
  },
  outOf: { color: tokens.colorNeutralForeground3 },
  band: { fontWeight: tokens.fontWeightSemibold },
  note: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase100,
  },
  dimensions: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  dimensionRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXS,
  },
  dimensionLabel: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalS,
  },
  track: {
    height: '4px',
    borderRadius: tokens.borderRadiusSmall,
    backgroundColor: tokens.colorNeutralBackground5,
    overflow: 'hidden',
  },
  fill: { height: '100%' },
  penalties: {
    margin: '0',
    paddingLeft: tokens.spacingHorizontalL,
    color: tokens.colorNeutralForeground2,
    fontSize: tokens.fontSizeBase200,
  },
});

/**
 * The deterministic verdict, shown first: it is the one part of the pane that
 * is measured rather than written by a model, so it carries the summary.
 */
export function HealthCard({ health }: { health: FormulaHealth }): JSX.Element {
  const styles = useStyles();
  const t = useTranslation();
  const color = BAND_COLOR[health.band];

  const topPenalties = DIMENSION_ORDER.flatMap(
    (name) => health.dimensions[name].penalties,
  )
    .sort((a, b) => b.points - a.points)
    .slice(0, 3);

  return (
    <div className={styles.card}>
      <div>
        <div className={styles.headline}>
          <Text className={styles.score} style={{ color }}>
            {health.score}
          </Text>
          <Text className={styles.outOf} size={200}>
            / 100
          </Text>
          <Text className={styles.band} style={{ color }}>
            {t.health.band[health.band]}
          </Text>
        </div>
        <Text className={styles.note}>{t.health.deterministicNote}</Text>
      </div>

      <div className={styles.dimensions}>
        {DIMENSION_ORDER.map((name) => {
          const dimension = health.dimensions[name];
          return (
            <div key={name} className={styles.dimensionRow}>
              <div className={styles.dimensionLabel}>
                <Text size={200}>{t.health.dimension[name]}</Text>
                <Text size={200} className={styles.outOf}>
                  {dimension.score}
                </Text>
              </div>
              <div
                className={styles.track}
                role="meter"
                aria-label={t.health.dimension[name]}
                aria-valuenow={dimension.score}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className={styles.fill}
                  style={{
                    width: `${dimension.score}%`,
                    backgroundColor:
                      dimension.score >= 75
                        ? tokens.colorPaletteGreenBackground3
                        : dimension.score >= 55
                          ? tokens.colorPaletteYellowBackground3
                          : tokens.colorPaletteRedBackground3,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {topPenalties.length > 0 ? (
        <ul className={styles.penalties}>
          {topPenalties.map((penalty) => (
            <li key={penalty.id}>{`${penaltyLabel(penalty, t)} (−${penalty.points})`}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/**
 * The API and the add-in deploy separately, so a penalty id can arrive that
 * this build has no translation for. Fall back to the server's English label
 * rather than showing nothing.
 */
function penaltyLabel(penalty: HealthPenalty, t: Dictionary): string {
  return t.health.penalty[penalty.id] ?? penalty.label;
}
