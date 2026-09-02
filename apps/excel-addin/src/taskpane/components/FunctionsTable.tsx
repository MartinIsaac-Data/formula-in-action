import type { ExplanationFunction } from '@formula-in-action/shared-types';
import {
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  makeStyles,
  Text,
  tokens,
} from '@fluentui/react-components';

const useStyles = makeStyles({
  row: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalXXS },
  name: { fontFamily: tokens.fontFamilyMonospace, fontWeight: tokens.fontWeightSemibold },
  purpose: { color: tokens.colorNeutralForeground2 },
  detail: { color: tokens.colorNeutralForeground3, paddingTop: tokens.spacingVerticalXS },
  empty: { color: tokens.colorNeutralForeground3 },
});

export function FunctionsTable({ functions }: { functions: ExplanationFunction[] }): JSX.Element {
  const styles = useStyles();

  if (functions.length === 0) {
    return (
      <Text className={styles.empty} size={200}>
        This formula does not use any functions.
      </Text>
    );
  }

  return (
    <Accordion multiple collapsible>
      {functions.map((fn) => (
        <AccordionItem key={fn.name} value={fn.name}>
          <AccordionHeader>
            <div className={styles.row}>
              <Text className={styles.name}>{fn.name}</Text>
              <Text className={styles.purpose} size={200}>
                {fn.purpose}
              </Text>
            </div>
          </AccordionHeader>
          <AccordionPanel>
            <Text className={styles.detail} size={200}>
              {fn.detail ?? fn.purpose}
            </Text>
          </AccordionPanel>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
