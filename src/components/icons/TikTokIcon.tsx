import * as React from "react";

interface TikTokIconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

const TikTokIcon: React.FC<TikTokIconProps> = ({ className, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    focusable="false"
    className={className}
    fill="currentColor"
    {...props}
  >
    <path d="M13.5 3v9.38c0 2.8-2.27 5.07-5.07 5.07S3.36 15.18 3.36 12.38c0-2.53 1.86-4.64 4.29-5.01.24-.04.49-.06.74-.06.35 0 .69.04 1.02.12v2.91a3.32 3.32 0 0 0-1.02-.16 3.15 3.15 0 0 0-3.15 3.15 3.15 3.15 0 0 0 3.15 3.15 3.15 3.15 0 0 0 3.15-3.15V3h2.96c.28 1.62 1.58 2.96 3.19 3.33.33.08.66.12 1.01.12v2.89c-1.33 0-2.58-.35-3.67-.96v3.69c0 4.03-3.27 7.3-7.3 7.3S.2 16.1.2 12.07c0-3.63 2.63-6.66 6.07-7.24.33-.06.68-.09 1.03-.09.71 0 1.4.1 2.05.3V3h4.15z" />
  </svg>
);

export default TikTokIcon;
