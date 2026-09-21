import type { AlertProps } from 'antd';
import { Alert, Button } from 'antd';

type RetryAlertProps = Pick<
  AlertProps,
  | 'type'
  | 'message'
  | 'description'
  | 'closable'
  | 'onClose'
  | 'showIcon'
  | 'style'
> & {
  onRetry: () => void;
  retryLoading?: boolean;
  retryDisabled?: boolean;
};

const RetryAlertDescription = ({
  description,
  type,
  onRetry,
  retryLoading,
  retryDisabled,
}: Pick<
  RetryAlertProps,
  'description' | 'type' | 'onRetry' | 'retryLoading' | 'retryDisabled'
>): React.JSX.Element => {
  const hasDescription =
    description !== null &&
    description !== undefined &&
    description !== false &&
    description !== true;

  return (
    <div>
      {hasDescription ? <div>{description}</div> : null}
      <div style={{ marginTop: hasDescription ? 12 : 0 }}>
        <Button
          danger={type === 'error'}
          disabled={retryDisabled}
          loading={retryLoading}
          onClick={onRetry}
          size="middle"
          type="primary"
        >
          Повторить
        </Button>
      </div>
    </div>
  );
};

export const RetryAlert = ({
  type,
  message,
  description,
  closable,
  onClose,
  showIcon,
  style,
  onRetry,
  retryLoading,
  retryDisabled,
}: RetryAlertProps): React.JSX.Element => {
  return (
    <Alert
      closable={closable}
      description={
        <RetryAlertDescription
          description={description}
          onRetry={onRetry}
          retryDisabled={retryDisabled}
          retryLoading={retryLoading}
          type={type}
        />
      }
      message={message}
      onClose={onClose}
      showIcon={showIcon}
      style={style}
      type={type}
    />
  );
};
