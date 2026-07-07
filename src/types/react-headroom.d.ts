declare module "react-headroom" {
  import * as React from "react";

  export interface HeadroomProps {
    className?: string;
    style?: React.CSSProperties;
    onPin?: () => void;
    onUnpin?: () => void;
    onUnfix?: () => void;
    upTolerance?: number;
    downTolerance?: number;
    disable?: boolean;
    disableInlineStyles?: boolean;
    wrapperStyle?: React.CSSProperties;
    parent?: () => HTMLElement | Window;
    pinStart?: number;
    calcHeightOnResize?: boolean;
    children?: React.ReactNode;
  }

  export default class Headroom extends React.Component<HeadroomProps> {}
}
