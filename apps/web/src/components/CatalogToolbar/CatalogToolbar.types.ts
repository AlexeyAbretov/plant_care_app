import type { PlantSort } from '@types';

export type CatalogToolbarProps = {
  categoriesDrawerOpen: boolean;
  disabled?: boolean;
  onCategoriesDrawerOpenChange: (open: boolean) => void;
  onSortChange: (sort: PlantSort) => void;
  sort: PlantSort;
};
