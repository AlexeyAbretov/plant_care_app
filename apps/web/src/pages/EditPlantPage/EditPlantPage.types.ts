import type { PlantFormValues } from '@components';
import type { Plant } from '@types';

export type EditStep = 'loading' | 'form' | 'saving' | 'notFound' | 'error';

export type EditPlantScreenProps = {
  id: string;
};

export type EditPlantFormProps = {
  disabled: boolean;
  plant: Plant;
  saveError: string | null;
  onCancel: () => void;
  onCloseError: () => void;
  onDelete: () => Promise<void>;
  onSubmit: (values: PlantFormValues) => Promise<void>;
};
