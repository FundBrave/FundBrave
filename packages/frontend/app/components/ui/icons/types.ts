import { SVGProps, ForwardRefExoticComponent, RefAttributes } from 'react';

export interface IconProps extends SVGProps<SVGSVGElement> {
  size?: number | string;
  className?: string;
}

export type IconComponent = ForwardRefExoticComponent<
  IconProps & RefAttributes<SVGSVGElement>
>;
