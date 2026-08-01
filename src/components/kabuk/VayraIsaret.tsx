/* eslint-disable @next/next/no-img-element */
/**
 * Vayra marka işareti — GERÇEK üretilen logo (public/brand/vayra-mark.png).
 * Cam-efektli cyan dalga/kanat amblemi (logo reveal videosunun son karesinden),
 * ŞEFFAF arka plan. Kanat formu yatay olduğu için kutu 1.35× genişletilir ki
 * logo nav'da yeterince büyük ve okunur görünsün.
 */
export function VayraIsaret({ size = 34, className }: { size?: number; className?: string }) {
  const w = Math.round(size * 1.35);
  return (
    <img
      src="/brand/vayra-mark.png"
      alt="Vayra"
      width={w}
      height={size}
      className={className}
      style={{ display: "inline-block", width: w, height: size, objectFit: "contain" }}
      draggable={false}
    />
  );
}
