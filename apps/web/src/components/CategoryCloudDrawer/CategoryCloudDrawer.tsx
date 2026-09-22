import { Drawer, Flex, Tag, theme, Typography } from 'antd';
import { useState } from 'react';

import type {
  CategoryCloudContentProps,
  CategoryCloudDrawerProps,
} from './CategoryCloudDrawer.types';

const { CheckableTag } = Tag;

const PANEL_WIDTH = 280;

const CategoryCloudContent = ({
  categories,
  categoryOptions,
  disabled = false,
  onCategoriesChange,
}: CategoryCloudContentProps): React.JSX.Element => {
  const { token } = theme.useToken();
  const [hoveredName, setHoveredName] = useState<string | null>(null);

  const toggleCategory = (name: string): void => {
    if (disabled) {
      return;
    }

    if (categories.includes(name)) {
      onCategoriesChange(categories.filter((item) => item !== name));

      return;
    }

    onCategoriesChange([...categories, name]);
  };

  if (!categoryOptions.length) {
    return (
      <Typography.Text type="secondary">
        Категорий пока нет — они появятся у растений с указанной категорией.
      </Typography.Text>
    );
  }

  return (
    <Flex gap={8} wrap="wrap">
      {categoryOptions.map((name) => {
        const checked = categories.includes(name);
        const hovered = hoveredName === name && !checked;

        return (
          <span
            key={name}
            onMouseEnter={() => {
              setHoveredName(name);
            }}
            onMouseLeave={() => {
              setHoveredName(null);
            }}
          >
            <CheckableTag
              checked={checked}
              onChange={() => {
                toggleCategory(name);
              }}
              style={{
                background: checked
                  ? token.colorPrimary
                  : token.colorBgContainer,
                border: `1px solid ${
                  checked || hovered ? token.colorPrimary : token.colorBorder
                }`,
                borderRadius: token.borderRadiusSM,
                color: checked
                  ? token.colorTextLightSolid
                  : hovered
                    ? token.colorPrimary
                    : token.colorText,
                lineHeight: 1.4,
                marginInlineEnd: 0,
                overflowWrap: 'anywhere',
                padding: '4px 10px',
                whiteSpace: 'normal',
                wordBreak: 'break-word',
              }}
            >
              {name}
            </CheckableTag>
          </span>
        );
      })}
    </Flex>
  );
};

export const CategoryCloudDrawer = ({
  categories,
  categoryOptions,
  disabled = false,
  embedded,
  onCategoriesChange,
  onOpenChange,
  open,
}: CategoryCloudDrawerProps): React.JSX.Element | null => {
  const { token } = theme.useToken();
  const cloud = (
    <CategoryCloudContent
      categories={categories}
      categoryOptions={categoryOptions}
      disabled={disabled}
      onCategoriesChange={onCategoriesChange}
    />
  );

  if (embedded) {
    if (!open) {
      return null;
    }

    return (
      <aside
        aria-label="Фильтр по категориям"
        style={{
          background: token.colorPrimaryBg,
          border: `1px solid ${token.colorPrimaryBorder}`,
          borderRadius: token.borderRadiusLG,
          boxShadow: token.boxShadowTertiary,
          flexShrink: 0,
          padding: 16,
          width: PANEL_WIDTH,
        }}
      >
        <Typography.Text
          strong
          style={{
            color: token.colorPrimaryText,
            display: 'block',
            marginBottom: 12,
          }}
        >
          Категории
        </Typography.Text>
        {cloud}
      </aside>
    );
  }

  return (
    <Drawer
      destroyOnHidden={false}
      maskClosable
      onClose={() => {
        onOpenChange(false);
      }}
      open={open}
      placement="left"
      title="Категории"
      width={PANEL_WIDTH}
    >
      {cloud}
    </Drawer>
  );
};
