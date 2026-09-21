import { Button, Flex, Segmented } from 'antd';

import { FilterOutlined } from '@ant-design/icons';
import type { PlantSort } from '@types';

import type { CatalogToolbarProps } from './CatalogToolbar.types';

export const CatalogToolbar = ({
  categoriesDrawerOpen,
  disabled = false,
  onCategoriesDrawerOpenChange,
  onSortChange,
  sort,
}: CatalogToolbarProps): React.JSX.Element => {
  return (
    <Flex align="center" gap="middle" style={{ minWidth: 0, width: '100%' }}>
      <Button
        aria-expanded={categoriesDrawerOpen}
        aria-label={
          categoriesDrawerOpen ? 'Скрыть категории' : 'Показать категории'
        }
        disabled={disabled}
        icon={<FilterOutlined />}
        onClick={() => {
          onCategoriesDrawerOpenChange(!categoriesDrawerOpen);
        }}
        type={categoriesDrawerOpen ? 'primary' : 'default'}
      />
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
    </Flex>
  );
};
