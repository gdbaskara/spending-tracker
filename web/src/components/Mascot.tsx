import React from "react";

// "Pochi" — the celengan (piggy bank) mascot. Ported from the design's SVG.
export function Mascot({
  size = 120,
  mood = "happy",
}: {
  size?: number;
  mood?: "happy" | "sleepy" | "proud";
}) {
  const pink = "#F7B5CB";
  const dark = "#EC9CB8";
  const blush = "#F58BB0";
  const eye = "#5b4a52";
  const nostril = "#D98AA3";
  const spark = "#F4C04E";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      style={{ overflow: "visible" }}
    >
      {mood === "proud" && (
        <g fill={spark}>
          <path d="M16 30l1.6 3.8 3.8 1.6-3.8 1.6L16 40.8l-1.6-3.8-3.8-1.6 3.8-1.6L16 30Z" />
          <path d="M104 24l1.4 3.3 3.3 1.4-3.3 1.4-1.4 3.3-1.4-3.3-3.3-1.4 3.3-1.4L104 24Z" />
        </g>
      )}
      {/* ears */}
      <path d="M30 34c-6-8-3-16 4-15 4 .6 7 5 8 11" fill={dark} />
      <path d="M90 34c6-8 3-16-4-15-4 .6-7 5-8 11" fill={dark} />
      {/* body */}
      <ellipse cx="60" cy="64" rx="42" ry="38" fill={pink} stroke={dark} strokeWidth="2" strokeOpacity="0.5" />
      {/* coin slot */}
      <rect x="49" y="31" width="22" height="5" rx="2.5" fill={dark} />
      {/* legs */}
      <rect x="34" y="96" width="12" height="10" rx="5" fill={dark} />
      <rect x="74" y="96" width="12" height="10" rx="5" fill={dark} />
      {/* snout */}
      <ellipse cx="60" cy="72" rx="16" ry="12" fill="#FBC9D8" stroke={dark} strokeWidth="1.5" />
      <circle cx="54" cy="72" r="2.6" fill={nostril} />
      <circle cx="66" cy="72" r="2.6" fill={nostril} />
      {/* blush */}
      <ellipse cx="34" cy="66" rx="6" ry="4" fill={blush} opacity="0.55" />
      <ellipse cx="86" cy="66" rx="6" ry="4" fill={blush} opacity="0.55" />
      {/* eyes */}
      {mood === "sleepy" ? (
        <g stroke={eye} strokeWidth="2.4" strokeLinecap="round" fill="none">
          <path d="M40 54c2 2.5 6 2.5 8 0" />
          <path d="M72 54c2 2.5 6 2.5 8 0" />
        </g>
      ) : (
        <>
          <circle cx="44" cy="54" r="4.2" fill={eye} />
          <circle cx="76" cy="54" r="4.2" fill={eye} />
          <circle cx="45.6" cy="52.4" r="1.4" fill="#fff" />
          <circle cx="77.6" cy="52.4" r="1.4" fill="#fff" />
        </>
      )}
      {/* mouth */}
      <path d="M54 82c3 3 9 3 12 0" stroke={dark} strokeWidth="3" strokeLinecap="round" fill="none" />
      {/* tail */}
      <path d="M102 64c6-1 8 4 5 7s-7 0-5-4" stroke={dark} strokeWidth="3" strokeLinecap="round" fill="none" />
    </svg>
  );
}
