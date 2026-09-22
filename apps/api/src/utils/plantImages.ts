export const MAX_PLANT_IMAGES = 20;

export type PlantImageLike = {
  _id: { toString(): string };
  createdAt: Date | string;
};

export function sortPlantImages<T extends PlantImageLike>(
  images: readonly T[],
): T[] {
  return [...images].sort((left, right) => {
    return (
      new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
    );
  });
}

export function resolveCoverImage<T extends PlantImageLike>(
  images: readonly T[],
  defaultImageId?: { toString(): string } | null,
): T | undefined {
  const sorted = sortPlantImages(images);

  if (sorted.length === 0) {
    return undefined;
  }

  if (defaultImageId) {
    const selected = sorted.find((image) => {
      return image._id.toString() === defaultImageId.toString();
    });

    if (selected) {
      return selected;
    }
  }

  return sorted[sorted.length - 1];
}
