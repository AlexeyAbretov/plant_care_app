import {
  Button,
  List,
  Modal,
  Space,
  Spin,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import { useState } from 'react';

import { ApiError } from '../../api/index';
import type { PlantConditionResult, PlantHealthLevel } from '../../types/index';
import { RetryAlert } from '../index';

type PlantConditionButtonProps = {
  assess: () => Promise<PlantConditionResult>;
  disabled?: boolean;
  disabledTooltip?: string;
};

const HEALTH_LEVEL_LABELS: Record<PlantHealthLevel, string> = {
  good: 'Хорошее',
  fair: 'Удовлетворительное',
  poor: 'Требует внимания',
};

const HEALTH_LEVEL_COLORS: Record<PlantHealthLevel, string> = {
  good: 'success',
  fair: 'warning',
  poor: 'error',
};

function ConditionResultView({
  result,
}: {
  result: PlantConditionResult;
}): React.JSX.Element {
  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Tag color={HEALTH_LEVEL_COLORS[result.healthLevel]}>
        {HEALTH_LEVEL_LABELS[result.healthLevel]}
      </Tag>
      <Typography.Paragraph style={{ marginBottom: 0 }}>
        {result.assessment}
      </Typography.Paragraph>
      <div>
        <Typography.Text strong>Рекомендации:</Typography.Text>
        <List
          dataSource={result.recommendations}
          renderItem={(item, index) => (
            <List.Item style={{ paddingBlock: 4 }}>
              {index + 1}. {item}
            </List.Item>
          )}
          size="small"
        />
      </div>
    </Space>
  );
}

export function PlantConditionButton({
  assess,
  disabled = false,
  disabledTooltip,
}: PlantConditionButtonProps): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PlantConditionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runAssessment(): Promise<void> {
    setLoading(true);
    setError(null);

    try {
      const assessmentResult = await assess();

      setResult(assessmentResult);
    } catch (assessError: unknown) {
      const errorMessage =
        assessError instanceof ApiError
          ? assessError.message
          : 'Не удалось оценить состояние растения';

      setError(errorMessage);
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  function handleOpen(): void {
    setOpen(true);
    setResult(null);
    setError(null);
    void runAssessment();
  }

  function handleClose(): void {
    if (loading) {
      return;
    }

    setOpen(false);
    setResult(null);
    setError(null);
  }

  const button = (
    <Button disabled={disabled} loading={loading && !open} onClick={handleOpen}>
      Состояние
    </Button>
  );

  return (
    <>
      {disabled && disabledTooltip !== undefined ? (
        <Tooltip title={disabledTooltip}>
          <span>{button}</span>
        </Tooltip>
      ) : (
        button
      )}

      <Modal
        destroyOnHidden
        footer={
          <Space>
            {error !== null ? (
              <Button
                disabled={loading}
                loading={loading}
                onClick={() => {
                  void runAssessment();
                }}
                type="primary"
              >
                Проверить снова
              </Button>
            ) : null}
            <Button disabled={loading} onClick={handleClose}>
              Закрыть
            </Button>
          </Space>
        }
        onCancel={handleClose}
        open={open}
        title="Состояние растения"
        width={560}
      >
        {loading ? (
          <Spin tip="Оцениваем состояние…">
            <div style={{ minHeight: 120 }} />
          </Spin>
        ) : null}

        {!loading && error !== null ? (
          <RetryAlert
            message={error}
            onRetry={() => {
              void runAssessment();
            }}
            retryLoading={loading}
            showIcon
            type="error"
          />
        ) : null}

        {!loading && result !== null ? (
          <ConditionResultView result={result} />
        ) : null}
      </Modal>
    </>
  );
}
