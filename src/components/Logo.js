"use client";

export default function Logo({
  className = "w-8 h-8",
  color = "currentColor",
}) {
  return (
    <svg
      viewBox="0 0 120 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Replace this placeholder SVG with your actual logo SVG path */}
      {/* This is a sample court/sports themed icon */}
      <rect
        x="10"
        y="10"
        width="100"
        height="80"
        stroke={color}
        strokeWidth="4"
        rx="8"
      />
      <line x1="60" y1="10" x2="60" y2="90" stroke={color} strokeWidth="2" />
      <line x1="10" y1="50" x2="100" y2="50" stroke={color} strokeWidth="2" />
      <circle
        cx="60"
        cy="50"
        r="15"
        stroke={color}
        strokeWidth="3"
        fill="none"
      />
    </svg>
  );
}
