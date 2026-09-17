import { Segmented, Select, Space } from 'antd';
import type { CustomTagProps } from 'rc-select/lib/BaseSelect';

import { CloseOutlined } from '@ant-design/icons';

import type { PlantSort } from '../../types/plant.js';

type CatalogToolbarProps = {
  sort: PlantSort;
  categories: string[];
  categoryOptions: string[];
  disabled?: boolean;
  onSortChange: (sort: PlantSort) => void;
  onCategoriesChange: (categories: string[]) => void;
};

const CATEGORY_SELECT_WIDTH = 400;

function renderCategoryTag({
  label,
  closable,
  onClose,
}: CustomTagProps): React.JSX.Element {
  const text =
    typeof label === 'string' || typeof label === 'number'
      ? String(label)
      : null;

  if (text === null) {
    return <span className="ant-select-selection-item">{label}</span>;
  }

  return (
    <span className="ant-select-selection-item" title={text}>
      <span
        className="ant-select-selection-item-content"
        style={{
          overflowWrap: 'anywhere',
          whiteSpace: 'normal',
          wordBreak: 'break-word',
        }}
      >
        {text}
      </span>
      {closable ? (
        <span
          className="ant-select-selection-item-remove"
          onClick={onClose}
          onMouseDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
          unselectable="on"
        >
          <CloseOutlined />
        </span>
      ) : null}
    </span>
  );
}

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
        dropdownStyle={{ minWidth: CATEGORY_SELECT_WIDTH }}
        mode="multiple"
        onChange={(value) => {
          onCategoriesChange(value);
        }}
        options={categoryOptions.map((item) => ({
          label: item,
          value: item,
        }))}
        placeholder="Категории"
        popupMatchSelectWidth={false}
        style={{
          flex: `1 1 ${CATEGORY_SELECT_WIDTH}px`,
          maxWidth: '100%',
          minWidth: CATEGORY_SELECT_WIDTH,
          width: CATEGORY_SELECT_WIDTH,
        }}
        styles={{
          root: {
            height: 'auto',
          },
        }}
        tagRender={renderCategoryTag}
        value={categories}
      />
    </Space>
  );
}
