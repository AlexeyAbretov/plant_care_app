import { Segmented, Select, Space } from 'antd';
import type { CustomTagProps } from 'rc-select/lib/BaseSelect';
import type { DisplayValueType } from 'rc-select/lib/interface';

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

const CATEGORY_SELECT_MIN_WIDTH = 300;
const CATEGORY_LABEL_PREVIEW_LENGTH = 28;

function formatCategoryPreview(text: string): string {
  if (text.length <= CATEGORY_LABEL_PREVIEW_LENGTH) {
    return text;
  }

  return `${text.slice(0, CATEGORY_LABEL_PREVIEW_LENGTH)}…`;
}

function renderCategoryTag({
  label,
  closable,
  onClose,
  isMaxTag,
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
          display: 'inline-block',
          maxWidth: '100%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          verticalAlign: 'bottom',
          whiteSpace: 'nowrap',
        }}
      >
        {text}
      </span>
      {closable && !isMaxTag ? (
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

function renderOmittedCategories(
  omittedValues: DisplayValueType[],
): React.ReactNode {
  const labels = omittedValues.map((item) =>
    String(item.label ?? item.value ?? ''),
  );
  const first = labels[0] ?? '';
  const extra = labels.length > 1 ? ` (+${labels.length - 1})` : '';

  return (
    <span title={labels.join(', ')}>
      {`${formatCategoryPreview(first)}${extra}`}
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
        dropdownStyle={{ minWidth: CATEGORY_SELECT_MIN_WIDTH }}
        maxTagCount="responsive"
        maxTagPlaceholder={renderOmittedCategories}
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
          flex: '1 1 300px',
          maxWidth: 360,
          minWidth: CATEGORY_SELECT_MIN_WIDTH,
        }}
        tagRender={renderCategoryTag}
        value={categories}
      />
    </Space>
  );
}
