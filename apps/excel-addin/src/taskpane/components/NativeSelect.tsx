import { makeStyles, tokens } from '@fluentui/react-components';

const useStyles = makeStyles({
  select: {
    fontFamily: tokens.fontFamilyBase,
    fontSize: tokens.fontSizeBase300,
    padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalS}`,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    backgroundColor: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground1,
    cursor: 'pointer',
  },
});

/**
 * A plain `<select>`, not Fluent's `Dropdown` — deliberately. `Dropdown`'s
 * listbox popup (via `@fluentui/react-tabster`) has been crashing the pane to
 * a blank screen in this Office WebView2 build; a native select sidesteps
 * that entire code path and is universally reliable across hosts. Revisit
 * once the Dropdown crash is root-caused (see ErrorBoundary output).
 */
export function NativeSelect<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
  className,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  ariaLabel?: string;
  className?: string;
}): JSX.Element {
  const styles = useStyles();
  return (
    <select
      className={className ? `${styles.select} ${className}` : styles.select}
      value={value}
      aria-label={ariaLabel}
      onChange={(event) => onChange(event.target.value as T)}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
