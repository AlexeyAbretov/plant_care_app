export type DeletePlantButtonProps = {
  plantName: string;
  onConfirm: () => Promise<void>;
  disabled?: boolean;
};
