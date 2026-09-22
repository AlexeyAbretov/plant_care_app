import { DatePicker } from 'antd';
import dayjs from 'dayjs';

import type { PlantDateFieldProps } from './PlantForm.types';

export const PlantDateField = ({
  disabled = false,
  id,
  onChange,
  value,
}: PlantDateFieldProps): React.JSX.Element => {
  return (
    <DatePicker
      disabled={disabled}
      format="DD.MM.YYYY"
      id={id}
      onChange={(date) => {
        onChange?.(date === null ? '' : date.format('YYYY-MM-DD'));
      }}
      style={{ width: '12rem' }}
      value={value ? dayjs(value) : null}
    />
  );
};
