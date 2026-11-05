import type { SVGProps } from "react";

export type IconName =
  | "home"
  | "dumbbell"
  | "bike"
  | "history"
  | "user"
  | "play"
  | "pause"
  | "check"
  | "arrow"
  | "calendar"
  | "cloud"
  | "alert"
  | "info"
  | "close"
  | "contrast"
  | "list"
  | "plus";

export interface AppIconProps extends SVGProps<SVGSVGElement> {
  name: IconName;
  size?: number;
  direction?: "left" | "right" | "up" | "down";
}

export function AppIcon({
  name,
  size = 24,
  direction = "right",
  className = "",
  ...props
}: AppIconProps) {
  const commonProps = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
    "aria-hidden": props["aria-label"] ? undefined : true,
    ...props,
  };

  switch (name) {
    case "home":
      return (
        <svg {...commonProps}>
          <path d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1v-9.5z" />
        </svg>
      );

    case "dumbbell":
      return (
        <svg {...commonProps}>
          <path d="M2 10v4" />
          <path d="M6 7v10" />
          <path d="M6 12h12" />
          <path d="M18 7v10" />
          <path d="M22 10v4" />
        </svg>
      );

    case "bike":
      return (
        <svg {...commonProps}>
          <circle cx="5.5" cy="17.5" r="3.5" />
          <circle cx="18.5" cy="17.5" r="3.5" />
          <path d="M15 6h3" />
          <path d="M12 17.5V14l3-5 3.5 8.5" />
          <path d="M5.5 17.5l4-7.5h5.5" />
          <circle cx="12" cy="8" r="1" />
        </svg>
      );

    case "history":
      return (
        <svg {...commonProps}>
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
          <path d="M12 7v5l3 3" />
        </svg>
      );

    case "user":
      return (
        <svg {...commonProps}>
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      );

    case "play":
      return (
        <svg {...commonProps}>
          <polygon points="6 3 20 12 6 21 6 3" />
        </svg>
      );

    case "pause":
      return (
        <svg {...commonProps}>
          <line x1="10" y1="4" x2="10" y2="20" />
          <line x1="14" y1="4" x2="14" y2="20" />
        </svg>
      );

    case "check":
      return (
        <svg {...commonProps}>
          <polyline points="20 6 9 17 4 12" />
        </svg>
      );

    case "arrow": {
      let arrowPath = "M9 18l6-6-6-6"; // right default
      if (direction === "left") arrowPath = "M15 18l-6-6 6-6";
      if (direction === "up") arrowPath = "M18 15l-6-6-6 6";
      if (direction === "down") arrowPath = "M6 9l6 6 6-6";
      return (
        <svg {...commonProps}>
          <path d={arrowPath} />
        </svg>
      );
    }

    case "calendar":
      return (
        <svg {...commonProps}>
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      );

    case "cloud":
      return (
        <svg {...commonProps}>
          <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
        </svg>
      );

    case "alert":
      return (
        <svg {...commonProps}>
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      );

    case "info":
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      );

    case "close":
      return (
        <svg {...commonProps}>
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      );

    case "contrast":
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 3a9 9 0 0 0 0 18z" fill="currentColor" />
        </svg>
      );

    case "list":
      return (
        <svg {...commonProps}>
          <line x1="9" y1="6" x2="20" y2="6" />
          <line x1="9" y1="12" x2="20" y2="12" />
          <line x1="9" y1="18" x2="20" y2="18" />
          <circle cx="4.5" cy="6" r="1" />
          <circle cx="4.5" cy="12" r="1" />
          <circle cx="4.5" cy="18" r="1" />
        </svg>
      );

    case "plus":
      return (
        <svg {...commonProps}>
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      );

    default:
      return null;
  }
}
