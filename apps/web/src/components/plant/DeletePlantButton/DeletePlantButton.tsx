import { Button, Popconfirm } from 'antd';
import { useState } from 'react';

type DeletePlantButtonProps = {
  plantName: string;
  onConfirm: () => Promise<void>;
  disabled?: boolean;
};

export const DeletePlantButton = ({
  plantName,
  onConfirm,
  disabled = false,
}: DeletePlantButtonProps): React.JSX.Element => {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async (): Promise<void> => {
    setLoading(true);

    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Popconfirm
      cancelText="Отмена"
      description={
        `Растение «${plantName}» и все его изображения ` +
        'будут удалены безвозвратно.'
      }
      disabled={disabled || loading}
      okButtonProps={{ danger: true, loading }}
      okText="Удалить"
      onConfirm={() => {
        void handleConfirm();
      }}
      title="Удалить растение?"
    >
      <Button danger disabled={disabled || loading} loading={loading}>
        Удалить
      </Button>
    </Popconfirm>
  );
};
