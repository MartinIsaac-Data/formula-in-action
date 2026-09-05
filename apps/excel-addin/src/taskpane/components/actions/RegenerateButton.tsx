import { Button } from '@fluentui/react-components';
import { ArrowClockwiseRegular } from '@fluentui/react-icons';
import { useTranslation } from '../../i18n';

export function RegenerateButton({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled?: boolean;
}): JSX.Element {
  const t = useTranslation();
  return (
    <Button
      appearance="subtle"
      size="small"
      icon={<ArrowClockwiseRegular />}
      onClick={onClick}
      disabled={disabled}
    >
      {t.action.regenerate}
    </Button>
  );
}
