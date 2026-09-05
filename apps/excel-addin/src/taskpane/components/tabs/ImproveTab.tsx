import type { ExplanationResult } from '@formula-in-action/shared-types';
import { Text } from '@fluentui/react-components';
import { useTranslation } from '../../i18n';
import { CopyButton } from '../actions/CopyButton';
import { useTabStyles } from './shared';

export function ImproveTab({
  result,
  onCopySuggestion,
}: {
  result: ExplanationResult;
  onCopySuggestion?: () => void;
}): JSX.Element {
  const styles = useTabStyles();
  const t = useTranslation();

  if (result.suggestions.length === 0) {
    return (
      <div className={styles.panel}>
        <Text className={styles.heading} size={200}>
          {t.improve.heading}
        </Text>
        <Text className={styles.empty}>{t.improve.none}</Text>
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <Text className={styles.heading} size={200}>
        {t.improve.heading}
      </Text>
      {result.suggestions.map((suggestion) => (
        <div key={suggestion.id} className={styles.card}>
          <Text weight="semibold">{suggestion.title}</Text>
          <Text className={styles.prose} size={300}>
            {suggestion.rationale}
          </Text>
          {suggestion.suggestedFormula ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <code className={styles.code} style={{ flex: 1 }}>
                {suggestion.suggestedFormula}
              </code>
              <CopyButton
                value={suggestion.suggestedFormula}
                label={t.improve.copySuggestedFormula}
                onCopy={onCopySuggestion}
              />
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
