import { Drawer, Flex, Tag, Typography } from 'antd';

const { CheckableTag } = Tag;

const PANEL_WIDTH = 280;

type CategoryCloudContentProps = {
  categories: string[];
  categoryOptions: string[];
  disabled?: boolean;
  onCategoriesChange: (categories: string[]) => void;
};

function CategoryCloudContent({
  categories,
  categoryOptions,
  disabled = false,
  onCategoriesChange,
}: CategoryCloudContentProps): React.JSX.Element {
  function toggleCategory(name: string): void {
    if (disabled) {
      return;
    }

    if (categories.includes(name)) {
      onCategoriesChange(categories.filter((item) => item !== name));

      return;
    }

    onCategoriesChange([...categories, name]);
  }

  if (categoryOptions.length === 0) {
    return (
      <Typography.Text type="secondary">
        Категорий пока нет — они появятся у растений с указанной категорией.
      </Typography.Text>
    );
  }

  return (
    <Flex gap="small" wrap="wrap">
      {categoryOptions.map((name) => (
        <CheckableTag
          checked={categories.includes(name)}
          key={name}
          onChange={() => {
            toggleCategory(name);
          }}
          style={{
            marginInlineEnd: 0,
            overflowWrap: 'anywhere',
            whiteSpace: 'normal',
            wordBreak: 'break-word',
          }}
        >
          {name}
        </CheckableTag>
      ))}
    </Flex>
  );
}

type CategoryCloudDrawerProps = {
  categories: string[];
  categoryOptions: string[];
  disabled?: boolean;
  embedded: boolean;
  onCategoriesChange: (categories: string[]) => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

export function CategoryCloudDrawer({
  categories,
  categoryOptions,
  disabled = false,
  embedded,
  onCategoriesChange,
  onOpenChange,
  open,
}: CategoryCloudDrawerProps): React.JSX.Element | null {
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
          borderRight: '1px solid rgba(0, 0, 0, 0.06)',
          flexShrink: 0,
          paddingRight: 16,
          width: PANEL_WIDTH,
        }}
      >
        <Typography.Text strong style={{ display: 'block', marginBottom: 12 }}>
          Категории
        </Typography.Text>
        {cloud}
      </aside>
    );
  }

  return (
    <Drawer
      destroyOnClose={false}
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
}
