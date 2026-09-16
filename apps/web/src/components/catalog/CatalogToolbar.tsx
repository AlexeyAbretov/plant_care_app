import { Segmented, Select, Space } from 'antd';

import type { PlantSort } from '../../types/plant.js';

type CatalogToolbarProps = {
  sort: PlantSort;
  categories: string[];
  categoryOptions: string[];
  disabled?: boolean;
  onSortChange: (sort: PlantSort) => void;
  onCategoriesChange: (categories: string[]) => void;
};

export function CatalogToolbar({
  sort,
  categories,
  categoryOptions,
  disabled = false,
  onSortChange,
  onCategoriesChange,
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
        maxTagCount="responsive"
        mode="multiple"
        onChange={(value) => {
          onCategoriesChange(value);
        }}
        options={categoryOptions.map((item) => ({
          label: item,
          value: item,
        }))}
        placeholder="Категории"
        style={{ minWidth: 200 }}
        value={categories}
      />
    </Space>
  );
}
