import Svg, { Path, Circle, Line } from 'react-native-svg';

interface IconProps {
  color: string;
  bg?: string;
  size?: number;
  focused?: boolean;
}

const S = 1.6;

// House — reference SVG style, rounded bottom corners, shorter door
export function HomeIcon({ color, size = 24, focused = false }: IconProps) {
  // Single continuous path: house silhouette with door notch
  // Q beziers give rounded bottom corners + door top corners
  // All corners use ~2 unit Q bezier radius: peak, both eaves, both bottom corners
  // Z closes the left roof slope from left-eave-end back to peak-start
  const path = 'M10.5 4.3 Q12 3 13.5 4.3 L19.5 9.2 Q21 10.5 21 12.5 V20 Q21 22 19 22 H14 V18 Q14 17 13 17 H11 Q10 17 10 18 V22 H5 Q3 22 3 20 V12.5 Q3 10.5 4.5 9.2 Z';
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" opacity={focused ? 1 : 0.35}>
      <Path
        d={path}
        fill={focused ? color : 'none'}
        stroke={color}
        strokeWidth={S}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </Svg>
  );
}

// Calendar — same outer path for both states; divider + dots flip to bg on focus
export function CalendarIcon({ color, bg = 'transparent', size = 24, focused = false }: IconProps) {
  const outer = 'M18,2.5H6A3.5,3.5,0,0,0,2,6V18.5A3.5,3.5,0,0,0,6,22H18A3.5,3.5,0,0,0,22,18.5V6A3.5,3.5,0,0,0,18,2.5Z';
  const dotColor = focused ? bg : color;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" opacity={focused ? 1 : 0.35}>
      <Path d={outer} fill={focused ? color : 'none'} stroke={color} strokeWidth={S} />
      <Line x1={focused ? "1" : "2"} y1="9" x2={focused ? "23" : "22"} y2="9" stroke={focused ? bg : color} strokeWidth={S} />
      <Circle cx="7"  cy="15" r="1.5" fill={dotColor} />
      <Circle cx="12" cy="15" r="1.5" fill={dotColor} />
      <Circle cx="17" cy="15" r="1.5" fill={dotColor} />
    </Svg>
  );
}

// Chat — rounded bubble with bottom-left tail + two text lines
export function ChatIcon({ color, bg = 'transparent', size = 24, focused = false }: IconProps) {
  const bubble = 'M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 13.5997 2.37562 15.1116 3.04346 16.4525C3.22094 16.8088 3.28001 17.2161 3.17712 17.6006L2.58151 19.8267C2.32295 20.793 3.20701 21.677 4.17335 21.4185L6.39939 20.8229C6.78393 20.72 7.19121 20.7791 7.54753 20.9565C8.88837 21.6244 10.4003 22 12 22Z';
  const lineColor = focused ? bg : color;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" opacity={focused ? 1 : 0.35}>
      <Path
        d={bubble}
        fill={focused ? color : 'none'}
        stroke={color}
        strokeWidth={S}
      />
      <Path d="M8 10.5H16" stroke={lineColor} strokeWidth={S} strokeLinecap="round" />
      <Path d="M8 14H13.5" stroke={lineColor} strokeWidth={S} strokeLinecap="round" />
    </Svg>
  );
}

// Person — head circle + shoulder silhouette
export function ProfileIcon({ color, size = 24, focused = false }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" opacity={focused ? 1 : 0.35}>
      <Circle
        cx="12" cy="8" r="4.5"
        fill={focused ? color : 'none'}
        stroke={color}
        strokeWidth={S}
      />
      <Path
        d={focused
          ? "M2 23C2 18 7 15 12 15C17 15 22 18 22 23Z"
          : "M2 23C2 18 7 15 12 15C17 15 22 18 22 23"
        }
        fill={focused ? color : 'none'}
        stroke={color}
        strokeWidth={S}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
