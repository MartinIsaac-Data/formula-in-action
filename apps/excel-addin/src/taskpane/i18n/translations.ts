import type { ExplanationContext, ExplanationMode } from '@formula-in-action/shared-types';

export type Language = 'en' | 'fr';

export const LANGUAGE_OPTIONS: { value: Language; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'Français' },
];

export const DEFAULT_LANGUAGE: Language = 'en';

/**
 * BCP-47 tag for each UI language. Used as the `ExplainRequest.locale`
 * fallback when the user hasn't picked an explicit explanation language (see
 * `explanationLanguage.ts`) — i.e. "match Office" defaults to matching the
 * detected UI language too.
 */
export const LANGUAGE_LOCALE: Record<Language, string> = {
  en: 'en-US',
  fr: 'fr-FR',
};

export interface Dictionary {
  header: {
    subtitle: string;
    themeToLight: string;
    themeToDark: string;
  };
  settings: {
    ariaLabel: string;
    privacy: string;
    explanationLanguage: string;
    explanationLanguageAuto: string;
    telemetryLabel: string;
    telemetryDetail: string;
    apiHostDetail: (host: string) => string;
    privacyStatement: string;
  };
  mode: {
    options: Record<ExplanationMode, { label: string; hint: string }>;
  };
  context: {
    pickerLabel: string;
    options: Record<ExplanationContext, string>;
  };
  state: {
    readingCell: string;
    explaining: string;
    selectionErrorTitle: string;
    selectionErrorDetailFallback: string;
    tryAgain: string;
    emptyTitle: string;
    noSelection: string;
    noFormula: string;
    multipleCells: string;
  };
  error: {
    unparseableTitle: string;
    unparseableDetail: string;
    tooLongTitle: string;
    tooLongDetail: string;
    invalidRequestTitle: string;
    rateLimitedTitle: string;
    rateLimitedDetail: (seconds: number) => string;
    rateLimitedDetailGeneric: string;
    timeoutTitle: string;
    timeoutDetail: string;
    networkTitle: string;
    networkDetail: string;
    genericTitle: string;
  };
  formula: {
    label: string;
    copyLabel: string;
  };
  copy: {
    copied: string;
  };
  action: {
    regenerate: string;
  };
  tab: {
    overview: string;
    steps: string;
    example: string;
    issues: string;
    improve: string;
  };
  app: {
    degradedBanner: string;
  };
  overview: {
    whatItDoes: string;
    functionsUsed: string;
    likelyKpi: (name: string) => string;
  };
  steps: {
    heading: string;
    stepLabel: (n: number) => string;
  };
  example: {
    heading: string;
  };
  issues: {
    heading: string;
    none: string;
  };
  improve: {
    heading: string;
    none: string;
    copySuggestedFormula: string;
  };
  functionsTable: {
    empty: string;
  };
}

export const TRANSLATIONS: Record<Language, Dictionary> = {
  en: {
    header: {
      subtitle: 'Understand your Excel formulas',
      themeToLight: 'Switch to light theme',
      themeToDark: 'Switch to dark theme',
    },
    settings: {
      ariaLabel: 'Settings',
      privacy: 'Privacy',
      explanationLanguage: 'Explanation language',
      explanationLanguageAuto: 'Automatic (match Office)',
      telemetryLabel: 'Share anonymous usage stats',
      telemetryDetail:
        'Only the explanation mode, context, and whether it succeeded — never your formula or cell values. Off by default.',
      apiHostDetail: (host) => `Formulas are sent to ${host} for analysis, never stored.`,
      privacyStatement: 'Privacy statement',
    },
    mode: {
      options: {
        simple: { label: 'Simple', hint: 'Plain language for a beginner' },
        technical: { label: 'Technical', hint: 'Functions, arguments, evaluation order' },
        'formula-in-action': { label: 'In Action', hint: 'A real-world scenario' },
      },
    },
    context: {
      pickerLabel: 'Example context',
      options: {
        everyday: 'Everyday life',
        business: 'Business',
        finance: 'Finance',
        sales: 'Sales',
        'supply-chain': 'Supply chain',
        hr: 'Human resources',
        education: 'Education',
      },
    },
    state: {
      readingCell: 'Reading the selected cell…',
      explaining: 'Explaining this formula…',
      selectionErrorTitle: 'Could not read the selection',
      selectionErrorDetailFallback:
        'Excel would not share the formula — the workbook or sheet may be protected.',
      tryAgain: 'Try again',
      emptyTitle: 'Nothing to explain yet',
      noSelection: 'Select a cell to get started.',
      noFormula: 'The selected cell has a value, not a formula. Pick a cell that starts with “=”.',
      multipleCells: 'Select a single cell that contains a formula.',
    },
    error: {
      unparseableTitle: "That formula couldn't be read",
      unparseableDetail:
        'It may be incomplete, or use syntax this tool does not support yet. Check the cell and try again.',
      tooLongTitle: 'That formula is very long',
      tooLongDetail:
        'Formula in Action explains formulas up to about 8,000 characters. Try selecting a smaller cell or explaining a sub-part.',
      invalidRequestTitle: 'The request was rejected',
      rateLimitedTitle: 'Too many requests',
      rateLimitedDetail: (seconds) => `Give it ${seconds} seconds, then try again.`,
      rateLimitedDetailGeneric: 'Give it a few seconds, then try again.',
      timeoutTitle: 'The service is taking too long',
      timeoutDetail: 'It may be busy right now. Try again in a moment.',
      networkTitle: "Can't reach the explanation service",
      networkDetail: 'Check that the API is running and reachable from Excel.',
      genericTitle: 'Could not generate an explanation',
    },
    formula: {
      label: 'FORMULA',
      copyLabel: 'Copy formula',
    },
    copy: { copied: 'Copied' },
    action: { regenerate: 'Regenerate' },
    tab: {
      overview: 'Overview',
      steps: 'Step‑by‑step',
      example: 'Example',
      issues: 'Issues',
      improve: 'Improve',
    },
    app: {
      degradedBanner: 'Offline explanation (AI service unavailable) — structure and issues are still exact.',
    },
    overview: {
      whatItDoes: '📖 WHAT IT DOES',
      functionsUsed: '🔧 FUNCTIONS USED',
      likelyKpi: (name) => `Likely ${name}`,
    },
    steps: {
      heading: '🔍 STEP BY STEP',
      stepLabel: (n) => `Step ${n}`,
    },
    example: { heading: '💡 FORMULA IN ACTION' },
    issues: {
      heading: '⚠️ POTENTIAL ISSUES',
      none: 'No issues detected in this formula.',
    },
    improve: {
      heading: '✨ IMPROVE',
      none: 'This formula is already written well — no changes suggested.',
      copySuggestedFormula: 'Copy suggested formula',
    },
    functionsTable: { empty: 'This formula does not use any functions.' },
  },
  fr: {
    header: {
      subtitle: 'Comprenez vos formules Excel',
      themeToLight: 'Passer au thème clair',
      themeToDark: 'Passer au thème sombre',
    },
    settings: {
      ariaLabel: 'Paramètres',
      privacy: 'Confidentialité',
      explanationLanguage: 'Langue des explications',
      explanationLanguageAuto: "Automatique (celle d'Office)",
      telemetryLabel: "Partager des statistiques d'usage anonymes",
      telemetryDetail:
        "Uniquement le mode d'explication, le contexte, et si ça a fonctionné — jamais votre formule ni vos données. Désactivé par défaut.",
      apiHostDetail: (host) => `Les formules sont envoyées à ${host} pour analyse, jamais stockées.`,
      privacyStatement: 'Déclaration de confidentialité',
    },
    mode: {
      options: {
        simple: { label: 'Simple', hint: 'Langage simple pour un débutant' },
        technical: { label: 'Technique', hint: "Fonctions, arguments, ordre d'évaluation" },
        'formula-in-action': { label: 'En pratique', hint: 'Un scénario du monde réel' },
      },
    },
    context: {
      pickerLabel: "Contexte de l'exemple",
      options: {
        everyday: 'Vie quotidienne',
        business: 'Entreprise',
        finance: 'Finance',
        sales: 'Ventes',
        'supply-chain': "Chaîne d'approvisionnement",
        hr: 'Ressources humaines',
        education: 'Éducation',
      },
    },
    state: {
      readingCell: 'Lecture de la cellule sélectionnée…',
      explaining: 'Analyse de la formule…',
      selectionErrorTitle: 'Impossible de lire la sélection',
      selectionErrorDetailFallback:
        "Excel n'a pas partagé la formule — le classeur ou la feuille est peut-être protégé(e).",
      tryAgain: 'Réessayer',
      emptyTitle: 'Rien à expliquer pour le moment',
      noSelection: 'Sélectionnez une cellule pour commencer.',
      noFormula: 'La cellule sélectionnée contient une valeur, pas une formule. Choisissez une cellule qui commence par « = ».',
      multipleCells: 'Sélectionnez une seule cellule contenant une formule.',
    },
    error: {
      unparseableTitle: "Cette formule n'a pas pu être lue",
      unparseableDetail:
        "Elle est peut-être incomplète, ou utilise une syntaxe pas encore prise en charge. Vérifiez la cellule et réessayez.",
      tooLongTitle: 'Cette formule est très longue',
      tooLongDetail:
        "Formula in Action explique des formules jusqu'à environ 8 000 caractères. Essayez de sélectionner une cellule plus courte ou une sous-partie de la formule.",
      invalidRequestTitle: 'La demande a été rejetée',
      rateLimitedTitle: 'Trop de requêtes',
      rateLimitedDetail: (seconds) => `Patientez ${seconds} secondes, puis réessayez.`,
      rateLimitedDetailGeneric: 'Patientez quelques secondes, puis réessayez.',
      timeoutTitle: 'Le service met trop de temps à répondre',
      timeoutDetail: "Il est peut-être surchargé. Réessayez dans un instant.",
      networkTitle: "Impossible de joindre le service d'explication",
      networkDetail: "Vérifiez que l'API est démarrée et accessible depuis Excel.",
      genericTitle: "Impossible de générer une explication",
    },
    formula: {
      label: 'FORMULE',
      copyLabel: 'Copier la formule',
    },
    copy: { copied: 'Copié' },
    action: { regenerate: 'Régénérer' },
    tab: {
      overview: 'Aperçu',
      steps: 'Étape par étape',
      example: 'Exemple',
      issues: 'Problèmes',
      improve: 'Améliorer',
    },
    app: {
      degradedBanner:
        "Explication hors-ligne (service IA indisponible) — la structure et les problèmes détectés restent exacts.",
    },
    overview: {
      whatItDoes: '📖 CE QUE ÇA FAIT',
      functionsUsed: '🔧 FONCTIONS UTILISÉES',
      likelyKpi: (name) => `Probablement : ${name}`,
    },
    steps: {
      heading: '🔍 ÉTAPE PAR ÉTAPE',
      stepLabel: (n) => `Étape ${n}`,
    },
    example: { heading: '💡 FORMULA IN ACTION' },
    issues: {
      heading: '⚠️ PROBLÈMES POTENTIELS',
      none: 'Aucun problème détecté dans cette formule.',
    },
    improve: {
      heading: '✨ AMÉLIORER',
      none: 'Cette formule est déjà bien écrite — aucune amélioration suggérée.',
      copySuggestedFormula: 'Copier la formule suggérée',
    },
    functionsTable: { empty: "Cette formule n'utilise aucune fonction." },
  },
};
