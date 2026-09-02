import type { ExplanationResult } from '@formula-in-action/shared-types';
import { Text } from '@fluentui/react-components';
import { useTabStyles } from './shared';

export function ExampleTab({ result }: { result: ExplanationResult }): JSX.Element {
  const styles = useTabStyles();
  const example = result.illustrativeExample;

  return (
    <div className={styles.panel}>
      <Text className={styles.heading} size={200}>
        💡 FORMULA IN ACTION
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
