import { Alert, Button } from 'antd';

import type {
  RetryAlertDescriptionProps,
  RetryAlertProps,
} from './RetryAlert.types';

const RetryAlertDescription = ({
  description,
  type,
  onRetry,
  retryLoading,
  retryDisabled,
}: RetryAlertDescriptionProps): React.JSX.Element => {
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
