import type { ExplanationResult } from '@formula-in-action/shared-types';
import { Text } from '@fluentui/react-components';
import { useTranslation } from '../../i18n';
import { useTabStyles } from './shared';

export function StepByStepTab({ result }: { result: ExplanationResult }): JSX.Element {
  const styles = useTabStyles();
  const t = useTranslation();
  return (
    <div className={styles.panel}>
      <Text className={styles.heading} size={200}>
        {t.steps.heading}
      </Text>
      {result.steps.map((step, index) => (
        <div
          key={step.step}
          className={styles.step}
          style={index === result.steps.length - 1 ? { borderBottom: 'none' } : undefined}
        >
          <Text className={styles.stepIndex} size={200}>
            {t.steps.stepLabel(step.step)}
          </Text>
          {step.formulaPart ? <code className={styles.code}>{step.formulaPart}</code> : null}
          <Text className={styles.prose} size={300}>
            {step.explanation}
          </Text>
        </div>
      ))}
    </div>
  );
}
