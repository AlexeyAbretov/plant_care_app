import type { PlantConditionResult } from '@types';

export type PlantConditionButtonProps = {
  assess: () => Promise<PlantConditionResult>;
  disabled?: boolean;
  disabledTooltip?: string;
};

export type ConditionResultViewProps = {
  result: PlantConditionResult;
};
