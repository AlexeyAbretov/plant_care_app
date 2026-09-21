import { Flex, Segmented, Select } from 'antd';
import type { CustomTagProps } from 'rc-select/lib/BaseSelect';

import { CloseOutlined } from '@ant-design/icons';

import type { PlantSort } from '../../../types';

type CatalogToolbarProps = {
  sort: PlantSort;
  categories: string[];
  categoryOptions: string[];
  disabled?: boolean;
  onSortChange: (sort: PlantSort) => void;
  onCategoriesChange: (categories: string[]) => void;
};

const CATEGORY_DROPDOWN_MIN_WIDTH = 300;
const CATEGORY_SELECT_MAX_WIDTH = 360;

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
    <Flex gap="middle" style={{ minWidth: 0, width: '100%' }} wrap="wrap">
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
      <div
        style={{
          flex: '1 1 12rem',
          maxWidth: `min(100%, ${CATEGORY_SELECT_MAX_WIDTH}px)`,
          minWidth: 0,
          width: '100%',
        }}
      >
        <Select
          allowClear
          disabled={disabled}
          dropdownStyle={{ minWidth: CATEGORY_DROPDOWN_MIN_WIDTH }}
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
          style={{ width: '100%' }}
          styles={{
            root: {
              height: 'auto',
            },
          }}
          tagRender={renderCategoryTag}
          value={categories}
        />
      </div>
    </Flex>
  );
}
