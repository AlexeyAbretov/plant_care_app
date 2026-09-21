export type ImageUploadProps = {
  file: File | null;
  previewUrl: string | null;
  previewOriginalUrl?: string | null;
  onFileSelect: (file: File | null) => void;
  disabled?: boolean;
};
