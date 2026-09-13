import type { ExplanationMode, ExplanationResult } from '@formula-in-action/shared-types';
import { Badge, Divider, Text } from '@fluentui/react-components';
import { useTranslation } from '../../i18n';
import { FunctionsTable } from '../FunctionsTable';
import { HealthCard } from '../HealthCard';
import { useTabStyles } from './shared';

export function OverviewTab({
  result,
  mode,
}: {
  result: ExplanationResult;
  mode: ExplanationMode;
}): JSX.Element {
  const styles = useTabStyles();
  const t = useTranslation();
  const lead = mode === 'technical' ? result.technicalExplanation : result.simpleExplanation;

  return (
    <div className={styles.panel}>
      <Text className={styles.heading} size={200}>
        {t.health.heading}
      </Text>
      <HealthCard health={result.health} />

      <Divider />
      <Text className={styles.heading} size={200}>
        {t.overview.whatItDoes}
      </Text>
      <Text className={styles.prose}>{lead}</Text>
      <Text size={100} className={styles.provenance}>
        {t.health.aiNote}
      </Text>

      {result.detectedKpi ? (
        <div className={styles.card}>
          <Badge appearance="tint" color="brand">
            {t.overview.likelyKpi(result.detectedKpi.name)}
          </Badge>
          <Text size={200}>{result.detectedKpi.rationale}</Text>
        </div>
      ) : null}

      <Divider />
      <Text className={styles.heading} size={200}>
        {t.overview.functionsUsed}
      </Text>
      <FunctionsTable functions={result.functions} />
    </div>
  );
}
