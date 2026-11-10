import { SizedImg } from "@/components/ui/SizedImg";
import { cn } from "@/lib/cn";
import type { SizedImage } from "@/sanity/lib/image";

/**
 * A rental photo (or a quiet placeholder until Fiú shoots its own). Product shots are padded and
 * shot on white, so they sit whole (`object-contain`) on a white tile instead of being cropped.
 */
export function RentalImageView({
  image,
  placeholder,
  sizes,
  priority,
  loading,
  className,
}: {
  image: SizedImage | null;
  placeholder: string;
  sizes: string;
  priority?: boolean;
  loading?: "eager" | "lazy";
  className?: string;
}) {
  if (!image) {
    return (
      <div className={cn("flex items-center justify-center bg-bg-raised text-sm text-fg-muted", className)}>{placeholder}</div>
    );
  }
  return (
    <SizedImg
      image={image}
      fit="contain"
      sizes={sizes}
      priority={priority}
      loading={loading}
      className={cn("bg-white", className)}
    />
  );
}
