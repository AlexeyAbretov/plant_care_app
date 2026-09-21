export type CategoryCloudContentProps = {
  categories: string[];
  categoryOptions: string[];
  disabled?: boolean;
  onCategoriesChange: (categories: string[]) => void;
};

export type CategoryCloudDrawerProps = {
  categories: string[];
  categoryOptions: string[];
  disabled?: boolean;
  embedded: boolean;
  onCategoriesChange: (categories: string[]) => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
};
