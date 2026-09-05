import type { FormulaWarning, ExplanationResult } from '@formula-in-action/shared-types';
import { MessageBar, MessageBarBody, MessageBarTitle, Text } from '@fluentui/react-components';
import { useTranslation } from '../../i18n';
import { useTabStyles } from './shared';

const INTENT: Record<FormulaWarning['severity'], 'info' | 'warning' | 'error'> = {
  info: 'info',
  warning: 'warning',
  critical: 'error',
};

export function IssuesTab({ result }: { result: ExplanationResult }): JSX.Element {
  const styles = useTabStyles();
  const t = useTranslation();

  if (result.warnings.length === 0) {
    return (
      <div className={styles.panel}>
        <Text className={styles.heading} size={200}>
          {t.issues.heading}
        </Text>
        <Text className={styles.empty}>{t.issues.none}</Text>
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <Text className={styles.heading} size={200}>
        {t.issues.heading}
      </Text>
      {result.warnings.map((warning) => (
        <MessageBar key={warning.id} intent={INTENT[warning.severity]}>
          <MessageBarBody>
            <MessageBarTitle>{warning.title}</MessageBarTitle>
            <div>{warning.message}</div>
            {warning.formulaPart ? (
              <code className={styles.code}>{warning.formulaPart}</code>
            ) : null}
          </MessageBarBody>
        </MessageBar>
      ))}
    </div>
  );
}
