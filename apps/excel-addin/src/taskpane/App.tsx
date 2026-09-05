import {
  FluentProvider,
  makeStyles,
  Tab,
  TabList,
  tokens,
} from '@fluentui/react-components';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { explanationErrorCopy } from './errorCopy';
import { I18nProvider, resolveExplanationLocale, useTranslation } from './i18n';
import type { ApiError } from './services/apiClient';
import { track } from './services/telemetry';
import { useExplanation } from './hooks/useExplanation';
import { usePreferences, type Preferences } from './hooks/usePreferences';
import { useSelectedFormula } from './hooks/useSelectedFormula';
import { useTelemetryConsent } from './hooks/useTelemetryConsent';
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
  const [telemetryEnabled, setTelemetryEnabled] = useTelemetryConsent();
  const [prefs, setPrefs] = usePreferences();

  useEffect(() => {
    track('pane_opened');
    // Intentionally only re-fires if the user enables telemetry after opening —
    // `track()` itself checks consent, so this stays a no-op until then.
  }, [telemetryEnabled]);

  return (
    <I18nProvider language={prefs.language}>
      <FluentProvider theme={theme} className={styles.app}>
        <Header
          mode={themeMode}
          onToggleTheme={toggle}
          telemetryEnabled={telemetryEnabled}
          onTelemetryChange={setTelemetryEnabled}
          explanationLanguage={prefs.explanationLanguage}
          onExplanationLanguageChange={(explanationLanguage) => setPrefs({ explanationLanguage })}
        />
        <Body prefs={prefs} setPrefs={setPrefs} />
      </FluentProvider>
    </I18nProvider>
  );
}

function Body({
  prefs,
  setPrefs,
}: {
  prefs: Preferences;
  setPrefs: (patch: Partial<Preferences>) => void;
}): JSX.Element {
  const styles = useStyles();
  const t = useTranslation();
  const selection = useSelectedFormula();
  const [tab, setTab] = useState<TabId>('overview');

  const query = useMemo(() => {
    if (selection.status !== 'ok' || !selection.formula) return null;
    return {
      formula: selection.formula,
      mode: prefs.mode,
      context: prefs.context,
      locale: resolveExplanationLocale(prefs.explanationLanguage, prefs.language),
      cellAddress: selection.cellAddress,
      sheetNames: selection.sheetNames,
      namedRanges: selection.namedRanges,
    };
  }, [selection, prefs.mode, prefs.context, prefs.language, prefs.explanationLanguage]);

  const explanation = useExplanation(query, { unknownErrorMessage: t.error.genericTitle });

  const handleModeChange = useCallback(
    (mode: typeof prefs.mode) => {
      setPrefs({ mode });
      track('mode_changed', { mode });
    },
    [setPrefs],
  );
  const handleContextChange = useCallback(
    (context: typeof prefs.context) => {
      setPrefs({ context });
      track('context_changed', { context });
    },
    [setPrefs],
  );
  const handleRegenerate = useCallback(() => {
    track('regenerated', { mode: prefs.mode, context: prefs.context });
    explanation.regenerate();
  }, [explanation, prefs.mode, prefs.context]);

  // Fire exactly once per settled explanation (success or error), not on every render.
  const settled = explanation.status === 'success' ? explanation.data : explanation.status === 'error' ? explanation.error : null;
  const lastTracked = useRef<unknown>(null);
  useEffect(() => {
    if (settled === null || lastTracked.current === settled) return;
    lastTracked.current = settled;

    if (explanation.status === 'success') {
      track('explanation_shown', {
        mode: prefs.mode,
        context: prefs.context,
        degraded: explanation.data.meta.degraded,
        warningCount: explanation.data.warnings.length,
        functionCount: explanation.data.functions.length,
      });
    } else if (explanation.status === 'error') {
      track('explanation_failed', { mode: prefs.mode, context: prefs.context, errorCode: explanation.error.code });
    }
  }, [explanation, settled, prefs.mode, prefs.context]);

  return (
    <>
      <ModeSwitcher value={prefs.mode} onChange={handleModeChange} />
      <ContextPicker value={prefs.context} onChange={handleContextChange} />

      <main className={styles.scroll}>
        {selection.status === 'loading' && <LoadingState label={t.state.readingCell} />}

        {selection.status === 'error' && (
          <ErrorState
            title={t.state.selectionErrorTitle}
            detail={selection.message ?? t.state.selectionErrorDetailFallback}
          />
        )}

        {(selection.status === 'no-selection' ||
          selection.status === 'no-formula' ||
          selection.status === 'multiple-cells') && <EmptyState status={selection.status} />}

        {selection.status === 'ok' && selection.formula && (
          <>
            <FormulaBlock formula={selection.formula} cellAddress={selection.cellAddress} />

            {explanation.status === 'loading' && <LoadingState label={t.state.explaining} />}

            {explanation.status === 'error' && (
              <ExplanationErrorState error={explanation.error} onRetry={handleRegenerate} />
            )}

            {explanation.status === 'success' && (
              <>
                <div className={styles.tabs}>
                  <TabList
                    size="small"
                    selectedValue={tab}
                    onTabSelect={(_e, data) => setTab(data.value as TabId)}
                  >
                    <Tab value="overview">{t.tab.overview}</Tab>
                    <Tab value="steps">{t.tab.steps}</Tab>
                    <Tab value="example">{t.tab.example}</Tab>
                    <Tab value="issues">
                      {t.tab.issues}
                      {explanation.data.warnings.length > 0 ? ` (${explanation.data.warnings.length})` : ''}
                    </Tab>
                    <Tab value="improve">{t.tab.improve}</Tab>
                  </TabList>
                  <RegenerateButton onClick={handleRegenerate} />
                </div>

                {explanation.data.meta.degraded && (
                  <div className={styles.degraded}>{t.app.degradedBanner}</div>
                )}

                {tab === 'overview' && (
                  <OverviewTab result={explanation.data} mode={prefs.mode} />
                )}
                {tab === 'steps' && <StepByStepTab result={explanation.data} />}
                {tab === 'example' && <ExampleTab result={explanation.data} />}
                {tab === 'issues' && <IssuesTab result={explanation.data} />}
                {tab === 'improve' && (
                  <ImproveTab
                    result={explanation.data}
                    onCopySuggestion={() =>
                      track('suggestion_copied', { mode: prefs.mode, context: prefs.context })
                    }
                  />
                )}
              </>
            )}
          </>
        )}
      </main>
    </>
  );
}

function ExplanationErrorState({
  error,
  onRetry,
}: {
  error: ApiError;
  onRetry: () => void;
}): JSX.Element {
  const t = useTranslation();
  const copy = explanationErrorCopy(error, t);
  return (
    <ErrorState
      title={copy.title}
      detail={copy.detail}
      onRetry={copy.canRetry ? onRetry : undefined}
    />
  );
}
