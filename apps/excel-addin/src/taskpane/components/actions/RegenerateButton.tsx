import { Button } from '@fluentui/react-components';
import { ArrowClockwiseRegular } from '@fluentui/react-icons';

export function RegenerateButton({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled?: boolean;
}): JSX.Element {
  return (
    <Button
      appearance="subtle"
      size="small"
      icon={<ArrowClockwiseRegular />}
      onClick={onClick}
      disabled={disabled}
    >
      Regenerate
    </Button>
  );
}
