import { useId } from "react";

const legGeometry = [
  {
    side: "left",
    pair: "front",
    tripod: "a",
    hip: [70, 81],
    knee: [45, 65],
    foot: [23, 44],
  },
  {
    side: "right",
    pair: "front",
    tripod: "b",
    hip: [90, 81],
    knee: [115, 65],
    foot: [137, 44],
  },
  {
    side: "left",
    pair: "middle",
    tripod: "b",
    hip: [67, 94],
    knee: [37, 96],
    foot: [13, 120],
  },
  {
    side: "right",
    pair: "middle",
    tripod: "a",
    hip: [93, 94],
    knee: [123, 96],
    foot: [147, 120],
  },
  {
    side: "left",
    pair: "rear",
    tripod: "a",
    hip: [70, 106],
    knee: [48, 127],
    foot: [32, 161],
  },
  {
    side: "right",
    pair: "rear",
    tripod: "b",
    hip: [90, 106],
    knee: [112, 127],
    foot: [128, 161],
  },
] as const;

/** Decorative scout; the parent distinguishes real fetching from idle patrol. */
export function AntScout() {
  const id = useId().replace(/:/g, "");
  const shell = `${id}-shell`;
  const abdomen = `${id}-abdomen`;
  return (
    <svg
      className="ant-scout"
      viewBox="0 0 160 190"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id={shell}
          x1="62"
          y1="50"
          x2="101"
          y2="101"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#f0c39c" />
          <stop offset=".25" stopColor="#c87651" />
          <stop offset=".56" stopColor="#93472f" />
          <stop offset="1" stopColor="#3c2826" />
        </linearGradient>
        <linearGradient
          id={abdomen}
          x1="57"
          y1="125"
          x2="100"
          y2="171"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#dd9b6e" />
          <stop offset=".28" stopColor="#aa583a" />
          <stop offset=".66" stopColor="#653727" />
          <stop offset="1" stopColor="#252c2a" />
        </linearGradient>
      </defs>
      <g className="ant-scout-body">
        <g
          className="ant-scout-legs"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {legGeometry.map(({ side, pair, tripod, hip, knee, foot }) => (
            <g
              key={`${side}-${pair}`}
              className={`ant-scout-leg ant-scout-tripod-${tripod} ant-scout-${side}`}
              style={{ transformOrigin: `${hip[0]}px ${hip[1]}px` }}
            >
              <path d={`M${hip} L${knee}`} stroke="#332e29" strokeWidth="6" />
              <path d={`M${hip} L${knee}`} stroke="#d59369" strokeWidth="2.3" />
              <g
                className="ant-scout-shin"
                style={{ transformOrigin: `${knee[0]}px ${knee[1]}px` }}
              >
                <path
                  d={`M${knee} L${foot} l${side === "left" ? -3 : 3} 5`}
                  stroke="#382d27"
                  strokeWidth="3.5"
                />
                <path
                  d={`M${knee} L${foot}`}
                  stroke="#c58f6a"
                  strokeWidth="1.1"
                />
                <circle cx={foot[0]} cy={foot[1]} r="1.8" fill="#ede0c9" />
              </g>
              <circle cx={knee[0]} cy={knee[1]} r="4" fill="#342e29" />
              <circle cx={knee[0]} cy={knee[1]} r="2.2" fill="#e1b288" />
              <circle
                cx={knee[0] - 0.5}
                cy={knee[1] - 0.5}
                r=".9"
                fill="#fff0d5"
              />
            </g>
          ))}
        </g>
        <g stroke="#322b25" strokeWidth="2.1">
          <path
            d="M73 111 71 126Q80 133 89 126L87 111Z"
            fill={`url(#${shell})`}
          />
          <path
            d="M79 119C60 119 52 135 56 151 59 168 72 178 80 181 89 178 102 168 105 151 109 135 100 119 81 119Z"
            fill={`url(#${abdomen})`}
          />
          <path
            d="M80 72C65 74 63 85 65 98 67 108 70 115 80 117 90 115 93 108 95 98 97 85 95 74 80 72Z"
            fill={`url(#${shell})`}
          />
          <path d="M72 72 72 65 88 65 88 72" fill="#684531" />
          <path
            d="M80 32C62 31 54 41 56 55 58 69 69 76 80 76 91 76 102 69 104 55 106 41 98 31 80 32Z"
            fill={`url(#${shell})`}
          />
        </g>
        <g stroke="#f3d1a8" strokeLinecap="round">
          <path
            d="M65 43Q69 37 78 38M68 84Q71 78 78 79M64 134Q68 126 78 126"
            strokeWidth="2"
            opacity=".8"
          />
          <path
            d="M59 143Q79 153 102 144M62 156Q79 166 99 156M70 169Q81 173 91 168"
            opacity=".28"
          />
          <path
            d="M79 41 79 58M74 88 73 100M85 88 87 100"
            strokeWidth=".8"
            opacity=".25"
          />
        </g>
        <g fill="#25312e" stroke="#e6b68c" strokeWidth="1">
          <ellipse
            cx="60"
            cy="51"
            rx="4.2"
            ry="6"
            transform="rotate(-18 60 51)"
          />
          <ellipse
            cx="100"
            cy="51"
            rx="4.2"
            ry="6"
            transform="rotate(18 100 51)"
          />
        </g>
        <g fill="#f8e6c5">
          <circle cx="59" cy="49" r="1.2" />
          <circle cx="99" cy="49" r="1.2" />
        </g>
        <g
          stroke="#493327"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M73 34 75 28 79 32M87 34 85 28 81 32" fill="#cc8a60" />
          <g className="ant-scout-antenna ant-scout-antenna-left">
            <path d="M66 39 62 18 40 10" />
            <path d="M66 39 62 18 40 10" stroke="#e6b18a" strokeWidth=".8" />
            <circle cx="40" cy="10" r="2" fill="#e6b18a" strokeWidth="1" />
          </g>
          <g className="ant-scout-antenna ant-scout-antenna-right">
            <path d="M94 39 98 18 120 10" />
            <path d="M94 39 98 18 120 10" stroke="#e6b18a" strokeWidth=".8" />
            <circle cx="120" cy="10" r="2" fill="#e6b18a" strokeWidth="1" />
          </g>
        </g>
      </g>
    </svg>
  );
}
