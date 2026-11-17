import { clayIconUrl, type ClayIconName } from './clay-art';

interface ClayIconProps {
  name: ClayIconName;
  size?: number;
}

/** Colourful 3D-style icon with soft gradients, gloss and a drop shadow. */
export function ClayIcon({ name, size = 40 }: ClayIconProps) {
  return (
    <img
      src={clayIconUrl(name)}
      width={size}
      height={size}
      alt=""
      aria-hidden="true"
      draggable={false}
    />
  );
}
