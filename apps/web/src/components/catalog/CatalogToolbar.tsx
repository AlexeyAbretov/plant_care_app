import { Segmented, Select, Space } from 'antd';

import type { PlantSort } from '../../types/plant.js';

type CatalogToolbarProps = {
  sort: PlantSort;
  category: string | undefined;
  categories: string[];
  disabled?: boolean;
  onSortChange: (sort: PlantSort) => void;
  onCategoryChange: (category: string | undefined) => void;
};

export function CatalogToolbar({
  sort,
  category,
  categories,
  disabled = false,
  onSortChange,
  onCategoryChange,
}: CatalogToolbarProps): React.JSX.Element {
  return (
    <Space wrap>
      <Segmented
        disabled={disabled}
        onChange={(value) => {
          onSortChange(value as PlantSort);
        }}
        options={[
          { label: 'По поливу', value: 'watering' },
          { label: 'По подкормке', value: 'fertilizing' },
        ]}
        value={sort}
      />
      <Select
        allowClear
        disabled={disabled}
        onChange={(value) => {
          onCategoryChange(value === '' ? undefined : value);
        }}
        options={[
          { label: 'Все категории', value: '' },
          ...categories.map((item) => ({ label: item, value: item })),
        ]}
        placeholder="Категория"
        style={{ minWidth: 200 }}
        value={category ?? ''}
      />
    </Space>
  );
}
