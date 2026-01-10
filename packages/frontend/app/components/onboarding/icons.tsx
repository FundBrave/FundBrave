"use client";

import * as React from "react";
import { useId } from "react";

interface IconProps extends React.SVGProps<SVGSVGElement> {
  useGradient?: boolean;
}

interface GradientDefsProps {
  gradientId: string;
}

const GradientDefs = ({ gradientId }: GradientDefsProps) => (
  <defs>
    <linearGradient
      id={gradientId}
      x1="4.14917"
      y1="2.0777"
      x2="22.5687"
      y2="3.86647"
      gradientUnits="userSpaceOnUse"
    >
      <stop stopColor="#450CF0" />
      <stop offset="1" stopColor="#CD82FF" />
    </linearGradient>
  </defs>
);

/* Mail Icon */
export const MailIcon = React.forwardRef<SVGSVGElement, IconProps>(
  ({ className, useGradient, ...props }, ref) => {
    const gradientId = useId();
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="21"
        height="18"
        viewBox="0 0 21 18"
        fill="none"
        className={className}
        {...props}
        ref={ref}
      >
        <GradientDefs gradientId={gradientId} />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M4.14433 0H16.5773C18.8662 0 20.7217 1.85548 20.7217 4.14433V13.4691C20.7217 15.7579 18.8662 17.6134 16.5773 17.6134H4.14433C1.85548 17.6134 0 15.7579 0 13.4691V4.14433C0 1.85548 1.85548 0 4.14433 0ZM11.8113 9.8946L18.3801 5.025C18.6733 4.80949 18.738 4.398 18.5252 4.10289C18.4237 3.96199 18.2695 3.86817 18.0978 3.84279C17.926 3.81742 17.7513 3.86266 17.6134 3.9682L10.9721 8.80671C10.8059 8.9809 10.5757 9.07946 10.3349 9.07946C10.0942 9.07946 9.86393 8.9809 9.69774 8.80671L3.10825 3.9682C2.97105 3.86598 2.79874 3.82272 2.62953 3.848C2.46032 3.87329 2.30818 3.96503 2.20686 4.10289C1.99179 4.39532 2.05182 4.80631 2.34155 5.025L8.86887 9.84279C9.27504 10.2281 9.8114 10.4463 10.3712 10.4541C10.9043 10.454 11.418 10.2544 11.8113 9.8946Z"
          fill={useGradient ? `url(#${gradientId})` : "currentColor"}
        />
      </svg>
    );
  }
);
MailIcon.displayName = "MailIcon";

/* Single User Icon */
export const UserIcon = React.forwardRef<SVGSVGElement, IconProps>(
  ({ className, useGradient, ...props }, ref) => {
    const gradientId = useId();
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="25"
        height="25"
        viewBox="0 0 25 25"
        fill="none"
        className={className}
        {...props}
        ref={ref}
      >
        <GradientDefs gradientId={gradientId} />
        <path
          d="M18.3993 14.5088C19.6865 14.5088 20.7299 15.5522 20.7299 16.8394V17.7912C20.7299 18.3854 20.5442 18.9647 20.1987 19.4482C18.5966 21.6899 15.9806 22.8006 12.4362 22.8006C8.89089 22.8006 6.27626 21.6895 4.67807 19.4465C4.33405 18.9637 4.14917 18.3856 4.14917 17.7927V16.8394C4.14917 15.5522 5.1926 14.5088 6.47974 14.5088L18.3993 14.5088ZM12.4362 2.0777C15.2979 2.0777 17.6178 4.39761 17.6178 7.25935C17.6178 10.1211 15.2979 12.441 12.4362 12.441C9.57439 12.441 7.25448 10.1211 7.25448 7.25935C7.25448 4.39761 9.57439 2.0777 12.4362 2.0777Z"
          fill={useGradient ? `url(#${gradientId})` : "currentColor"}
        />
      </svg>
    );
  }
);
UserIcon.displayName = "UserIcon";

/* Group Icon */
export const GroupPersonIcon = React.forwardRef<SVGSVGElement, IconProps>(
  ({ className, useGradient, ...props }, ref) => {
    const gradientId = useId();
    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        width="26"
        height="26"
        viewBox="0 0 26 26"
        fill="none"
        className={className}
        {...props}
      >
        <GradientDefs gradientId={gradientId} />
        <path
          d="M13.1515 12.6015C14.8481 12.6017 16.2315 11.2414 16.2598 9.54505V8.38464C16.2598 7.69593 15.9834 7.03601 15.4926 6.55293C15.0017 6.06985 14.3374 5.80405 13.6488 5.81515H12.6645C11.2495 5.82086 10.1054 6.96959 10.1054 8.38464V9.54505C10.133 11.2175 11.4791 12.5683 13.1515 12.6015Z"
          fill={useGradient ? `url(#${gradientId})` : "currentColor"}
        />
        <path
          d="M24.134 17.9477L24.0097 16.3832C23.8753 15.5975 23.2007 15.0187 22.4037 15.0052H17.9278C17.8592 14.9945 17.7893 14.9945 17.7206 15.0052C17.3235 14.5592 16.7533 14.3062 16.1561 14.311L10.1572 14.311C9.52483 14.3083 8.92581 14.5944 8.53057 15.0881C8.36128 15.0262 8.18241 14.9946 8.00217 14.9949H3.52628C2.726 15.0092 2.05029 15.5934 1.92036 16.3832L1.79603 17.9995C1.69191 18.4952 1.81155 19.0115 2.12305 19.4109C2.43454 19.8102 2.90623 20.052 3.41232 20.0717H8.1265C8.21944 20.0824 8.3133 20.0824 8.40624 20.0717C8.81717 20.5252 9.40014 20.7847 10.0122 20.7866H16.3012C16.8946 20.7837 17.4606 20.5364 17.8657 20.1027H22.5177C23.0422 20.0883 23.5313 19.8352 23.8461 19.4154C24.1609 18.9957 24.2669 18.4552 24.134 17.9477Z"
          fill={useGradient ? `url(#${gradientId})` : "currentColor"}
        />
        <path
          d="M20.2176 13.3889C21.4765 13.3889 22.497 12.3684 22.497 11.1095V10.2289C22.4972 9.71141 22.2881 9.21586 21.9174 8.85487C21.5466 8.49388 21.0457 8.29813 20.5284 8.31211H19.8032C18.7446 8.31211 17.8864 9.17027 17.8864 10.2289V11.1095C17.8862 11.7232 18.1335 12.3109 18.5722 12.7399C19.011 13.1689 19.6041 13.4029 20.2176 13.3889Z"
          fill={useGradient ? `url(#${gradientId})` : "currentColor"}
        />
        <path
          d="M5.76423 13.3889C7.0231 13.3889 8.04361 12.3684 8.04361 11.1095V10.2289C8.04361 9.17028 7.18545 8.31211 6.12686 8.31211H5.4016C4.343 8.31211 3.48484 9.17028 3.48484 10.2289V11.1095C3.48484 12.3684 4.50536 13.3889 5.76423 13.3889Z"
          fill={useGradient ? `url(#${gradientId})` : "currentColor"}
        />
      </svg>
    );
  }
);
GroupPersonIcon.displayName = "GroupPersonIcon";

/* Pencil Icon */
export const PencilIcon = React.forwardRef<SVGSVGElement, IconProps>(
  ({ className, useGradient, ...props }, ref) => {
    const gradientId = useId();
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="21"
        height="21"
        viewBox="0 0 21 21"
        fill="none"
        className={className}
        {...props}
        ref={ref}
      >
        <GradientDefs gradientId={gradientId} />
        <path
          d="M11.7081 14.1055L8.17501 14.8619C8.03729 14.877 7.89831 14.877 7.76058 14.8619C7.2705 14.8661 6.79957 14.6717 6.45512 14.3231C6.01243 13.869 5.82923 13.222 5.96816 12.6032L6.7245 9.08052C6.88517 8.38784 7.24539 7.75747 7.76058 7.26737L13.6663 1.3617L4.34151 1.3617C3.1859 1.34766 2.07353 1.80052 1.25633 2.61771C0.439137 3.43491 -0.0137258 4.54729 0.000317121 5.70289L0.000317121 16.4264C0.000317121 18.7953 1.92074 20.7157 4.2897 20.7157H15.0235C17.3925 20.7157 19.3129 18.7953 19.3129 16.4264V7.31918L13.5316 13.1109C13.0337 13.6131 12.3999 13.9589 11.7081 14.1055Z"
          fill={useGradient ? `url(#${gradientId})` : "currentColor"}
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M15.3654 1.14412C16.5645 -0.231527 18.6464 -0.388475 20.0382 0.791854C20.6215 1.46352 20.9124 2.34035 20.8463 3.22751C20.7801 4.11467 20.3624 4.93866 19.6859 5.51639L12.7752 12.4271C12.4108 12.7718 11.9533 13.0023 11.4594 13.0902L7.95744 13.8776C7.66931 13.9616 7.35843 13.8768 7.15287 13.6581C6.94732 13.4394 6.88188 13.1239 6.98352 12.8415L7.73986 9.31882C7.85541 8.83897 8.10307 8.40109 8.45476 8.0548L15.3654 1.14412ZM15.7902 5.97227L18.1111 3.65144C18.3963 3.34527 18.3879 2.86815 18.092 2.57224C17.7961 2.27632 17.319 2.2679 17.0128 2.5532L14.692 4.87402C14.389 5.17741 14.389 5.66889 14.692 5.97227C14.9954 6.27528 15.4868 6.27528 15.7902 5.97227Z"
          fill={useGradient ? `url(#${gradientId})` : "currentColor"}
        />
      </svg>
    );
  }
);
PencilIcon.displayName = "PencilIcon";

/* Rocket Icon */
export const RocketIcon = React.forwardRef<SVGSVGElement, IconProps>(
  ({ className, useGradient, ...props }, ref) => {
    const gradientId = useId();
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="25"
        height="25"
        viewBox="0 0 25 25"
        fill="none"
        className={className}
        {...props}
        ref={ref}
      >
        <GradientDefs gradientId={gradientId} />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M20.4729 15.3084L18.2972 14.5832V11.2884C18.2233 7.63651 16.3096 4.26906 13.21 2.33666C12.6608 1.98397 11.9564 1.98397 11.4072 2.33666C8.30756 4.26906 6.39388 7.63651 6.32003 11.2884V14.6246L4.14426 15.3499C3.52247 15.5597 3.10498 16.1442 3.10817 16.8004V20.9447C3.10966 21.5664 3.40941 22.1497 3.91407 22.5128C4.41873 22.8759 5.06698 22.9747 5.65694 22.7786L6.69302 22.4263C6.98925 22.723 7.39278 22.8874 7.81199 22.8822H9.3972C10.1301 22.9238 10.7613 22.3709 10.8166 21.6389L10.8166 18.8518C10.872 18.0798 11.5357 17.4945 12.3086 17.536C13.0815 17.4945 13.7452 18.0798 13.8006 18.8518V21.556C13.8558 22.288 14.4871 22.8409 15.22 22.7993H16.7948C17.214 22.8045 17.6176 22.6401 17.9138 22.3434L18.9499 22.6957C19.5459 22.9014 20.2047 22.8043 20.7159 22.4353C21.2272 22.0663 21.5269 21.4716 21.5194 20.8411V16.6968C21.4949 16.0608 21.0776 15.5071 20.4729 15.3084ZM13.0857 14.5106C13.0857 14.9398 12.7378 15.2877 12.3086 15.2877C11.8794 15.2877 11.5315 14.9398 11.5315 14.5106L11.5315 12.6975C11.5315 12.2683 11.8794 11.9204 12.3086 11.9204C12.7378 11.9204 13.0857 12.2683 13.0857 12.6975L13.0857 14.5106ZM10.7234 9.33022C10.7234 10.2057 11.4331 10.9154 12.3086 10.9154C13.1817 10.9098 13.8881 10.2034 13.8938 9.33022C13.8938 8.45474 13.1841 7.74502 12.3086 7.74502C11.4331 7.74502 10.7234 8.45474 10.7234 9.33022Z"
          fill={useGradient ? `url(#${gradientId})` : "currentColor"}
        />
      </svg>
    );
  }
);
RocketIcon.displayName = "RocketIcon";

/* Check Icon  */

const CheckIcon = React.forwardRef<SVGSVGElement, IconProps>(
  ({ className, useGradient, ...props }, ref) => {
    const gradientId = useId();
    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        width="26"
        height="26"
        viewBox="0 0 26 26"
        fill="none"
        className={className}
        {...props}
      >
        <GradientDefs gradientId={gradientId} />
        <polyline
          points="20 6 9 17 4 12"
          stroke={useGradient ? `url(#${gradientId})` : "currentColor"}
          strokeWidth="2"
          fill="none"
        />
      </svg>
    );
  }
);
CheckIcon.displayName = "CheckIcon";

export const onboardingIcons = {
  MailIcon,
  UserIcon,
  GroupPersonIcon,
  PencilIcon,
  RocketIcon,
  CheckIcon,
};

export default onboardingIcons;
