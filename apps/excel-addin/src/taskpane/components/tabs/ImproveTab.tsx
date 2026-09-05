import type { ExplanationResult } from '@formula-in-action/shared-types';
import { Text } from '@fluentui/react-components';
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

  if (result.suggestions.length === 0) {
    return (
      <div className={styles.panel}>
        <Text className={styles.heading} size={200}>
          ✨ IMPROVE
        </Text>
        <Text className={styles.empty}>
          This formula is already written well — no changes suggested.
        </Text>
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <Text className={styles.heading} size={200}>
        ✨ IMPROVE
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
                label="Copy suggested formula"
                onCopy={onCopySuggestion}
              />
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
