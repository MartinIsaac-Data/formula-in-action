import { Button, Tooltip } from '@fluentui/react-components';
import { CheckmarkRegular, CopyRegular } from '@fluentui/react-icons';
import { useCallback, useState } from 'react';

export function CopyButton({
  value,
  label,
  onCopy,
}: {
  value: string;
  label: string;
  /** Called after a successful copy — e.g. to log an anonymous usage event. */
  onCopy?: () => void;
}): JSX.Element {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(() => {
    void navigator.clipboard?.writeText(value).then(
      () => {
        setCopied(true);
        onCopy?.();
        setTimeout(() => setCopied(false), 1500);
      },
      () => undefined,
    );
  }, [value, onCopy]);

  return (
    <Tooltip content={copied ? 'Copied' : label} relationship="label">
      <Button
        appearance="subtle"
        size="small"
        icon={copied ? <CheckmarkRegular /> : <CopyRegular />}
        onClick={copy}
      />
    </Tooltip>
  );
}
