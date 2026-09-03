declare module "react-cytoscapejs" {
  import { Component, CSSProperties } from "react";
  import cytoscape from "cytoscape";

  export interface CytoscapeComponentProps {
    id?: string;
    elements: any[];
    style?: CSSProperties;
    stylesheet?: any;
    layout?: any;
    cy?: (cy: any) => void;
    userZoomingEnabled?: boolean;
    userPanningEnabled?: boolean;
    boxSelectionEnabled?: boolean;
    autoungrabify?: boolean;
    className?: string;
  }

  export default class CytoscapeComponent extends Component<CytoscapeComponentProps> {}
}
