import {
  FluentProvider,
  makeStyles,
  Tab,
  TabList,
  tokens,
} from '@fluentui/react-components';
import { useMemo, useState } from 'react';
import { ContextPicker } from './components/ContextPicker';
import { FormulaBlock } from './components/FormulaBlock';
import { Header } from './components/Header';
import { ModeSwitcher } from './components/ModeSwitcher';
import { RegenerateButton } from './components/actions/RegenerateButton';
import { EmptyState, ErrorState, LoadingState } from './components/states';
import { ExampleTab } from './components/tabs/ExampleTab';
import { ImproveTab } from './components/tabs/ImproveTab';
import { IssuesTab } from './components/tabs/IssuesTab';
import { OverviewTab } from './components/tabs/OverviewTab';
import { StepByStepTab } from './components/tabs/StepByStepTab';
import { useExplanation } from './hooks/useExplanation';
import { usePreferences } from './hooks/usePreferences';
import { useSelectedFormula } from './hooks/useSelectedFormula';
import { useOfficeTheme } from './theme/useOfficeTheme';

const useStyles = makeStyles({
  app: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    backgroundColor: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground1,
  },
  scroll: { flex: 1, overflowY: 'auto' },
  tabs: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `0 ${tokens.spacingHorizontalL}`,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  degraded: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalL}`,
  },
});

type TabId = 'overview' | 'steps' | 'example' | 'issues' | 'improve';

export function App(): JSX.Element {
  const styles = useStyles();
  const { theme, mode: themeMode, toggle } = useOfficeTheme();

  return (
    <FluentProvider theme={theme} className={styles.app}>
      <Header mode={themeMode} onToggleTheme={toggle} />
      <Body />
    </FluentProvider>
  );
}

function Body(): JSX.Element {
  const styles = useStyles();
  const selection = useSelectedFormula();
  const [prefs, setPrefs] = usePreferences();
  const [tab, setTab] = useState<TabId>('overview');

  const query = useMemo(() => {
    if (selection.status !== 'ok' || !selection.formula) return null;
    return {
      formula: selection.formula,
      mode: prefs.mode,
      context: prefs.context,
      cellAddress: selection.cellAddress,
      sheetNames: selection.sheetNames,
      namedRanges: selection.namedRanges,
    };
  }, [selection, prefs.mode, prefs.context]);

  const explanation = useExplanation(query);

  return (
    <>
      <ModeSwitcher value={prefs.mode} onChange={(mode) => setPrefs({ mode })} />
      <ContextPicker value={prefs.context} onChange={(context) => setPrefs({ context })} />

      <div className={styles.scroll}>
        {selection.status === 'loading' && <LoadingState label="Reading the selected cell…" />}

        {selection.status === 'error' && (
          <ErrorState
            title="Could not read the selection"
            detail={selection.message}
          />
        )}

        {(selection.status === 'no-selection' ||
          selection.status === 'no-formula' ||
          selection.status === 'multiple-cells') && <EmptyState status={selection.status} />}

        {selection.status === 'ok' && selection.formula && (
          <>
            <FormulaBlock formula={selection.formula} cellAddress={selection.cellAddress} />

            {explanation.status === 'loading' && (
              <LoadingState label="Explaining this formula…" />
            )}

            {explanation.status === 'error' && (
              <ErrorState
                title="Could not generate an explanation"
                detail={explanation.error.message}
                onRetry={explanation.regenerate}
              />
            )}

            {explanation.status === 'success' && (
              <>
                <div className={styles.tabs}>
                  <TabList
                    size="small"
                    selectedValue={tab}
                    onTabSelect={(_e, data) => setTab(data.value as TabId)}
                  >
                    <Tab value="overview">Overview</Tab>
                    <Tab value="steps">Step&#8209;by&#8209;step</Tab>
                    <Tab value="example">Example</Tab>
                    <Tab value="issues">
                      Issues{explanation.data.warnings.length > 0 ? ` (${explanation.data.warnings.length})` : ''}
                    </Tab>
                    <Tab value="improve">Improve</Tab>
                  </TabList>
                  <RegenerateButton onClick={explanation.regenerate} />
                </div>

                {explanation.data.meta.degraded && (
                  <div className={styles.degraded}>
                    Offline explanation (AI service unavailable) — structure and issues are still exact.
                  </div>
                )}

                {tab === 'overview' && (
                  <OverviewTab result={explanation.data} mode={prefs.mode} />
                )}
                {tab === 'steps' && <StepByStepTab result={explanation.data} />}
                {tab === 'example' && <ExampleTab result={explanation.data} />}
                {tab === 'issues' && <IssuesTab result={explanation.data} />}
                {tab === 'improve' && <ImproveTab result={explanation.data} />}
              </>
            )}
          </>
        )}
      </div>
    </>
  );
}
