import type { AlertProps } from 'antd';

export type RetryAlertProps = Pick<
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

export type RetryAlertDescriptionProps = Pick<
  RetryAlertProps,
  'description' | 'type' | 'onRetry' | 'retryLoading' | 'retryDisabled'
>;
