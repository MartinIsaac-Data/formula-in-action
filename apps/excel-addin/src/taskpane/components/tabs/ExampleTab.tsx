import type { ExplanationResult } from '@formula-in-action/shared-types';
import { Text } from '@fluentui/react-components';
import { useTranslation } from '../../i18n';
import { useTabStyles } from './shared';

export function ExampleTab({ result }: { result: ExplanationResult }): JSX.Element {
  const styles = useTabStyles();
  const t = useTranslation();
  const example = result.illustrativeExample;

  return (
    <div className={styles.panel}>
      <Text className={styles.heading} size={200}>
        {t.example.heading}
      </Text>
      <div className={styles.card}>
        <Text weight="semibold">{example.title}</Text>
        <Text className={styles.prose}>{example.scenario}</Text>
        {example.calculation ? (
          <code className={styles.code}>{example.calculation}</code>
        ) : null}
        <Text className={styles.prose} weight="semibold">
          {example.result}
        </Text>
      </div>
    </div>
  );
}
