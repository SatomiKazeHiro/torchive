export interface SkeletonBlockProps {
  width?: string;
  height?: string;
  rounded?: string;
}

export default function SkeletonBlock({
  width = "w-full",
  height = "h-4",
  rounded = "rounded-md",
}: SkeletonBlockProps) {
  return (
    <div
      className={` ${width} ${height} ${rounded} animate-shimmer bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%]`}
    />
  );
}
