# Cytoscape Crash Root Cause & Technical Forensic Analysis

## Summary
- **Bug:** `Unhandled Runtime Error: TypeError: n is not a function`
- **Component Stack:** `MoneyFlowGraph` -> `CytoscapeComponent` (`react-cytoscapejs`) -> `updateCytoscape` -> `componentDidMount` -> `cytoscape Core.batch`

## Root Cause Analysis
The wrapper library `react-cytoscapejs` (v2.0.0) declares internal default properties as an ES6 class getter:
```javascript
class CytoscapeComponent extends React.Component {
  static get defaultProps() {
    return {
      diff: (a, b) => ...,
      get: (e, t) => ...,
      toJson: e => e,
      forEach: (e, t) => e.forEach(t)
    };
  }
}
```
In modern React 18 / Next.js 14 SWC / webpack builds, `static get defaultProps()` is not invoked during component instantiation or prop normalization if props are passed without explicit overrides. Consequently:
1. Inside `updateCytoscape(null, this.props)`:
   `const { diff: o, toJson: l, get: s, forEach: a } = this.props;`
   resolves `o` (`diff`) to `undefined`.
2. The internal helper function `h(t, n, o, "elements")` calls `n(m(e, o), m(t, o))` where `n` is `o` (`undefined`).
3. Calling `undefined(...)` results in the exact runtime exception: `TypeError: n is not a function`.

## Root Cause Fix
Eliminated the fragile `react-cytoscapejs` React class wrapper completely. In `apps/web/components/graph/MoneyFlowGraph.tsx`, instantiated `cytoscape` directly via `useEffect` and React `useRef` on a DOM container `HTMLDivElement`:
```typescript
const cy = cytoscape({
  container: containerRef.current,
  elements: elements,
  style: stylesheet,
  layout: { name: "circle", padding: 50, animate: true, animationDuration: 400 },
  wheelSensitivity: 0.2,
  boxSelectionEnabled: false,
});
```
This guarantees full lifecycle management, clean unmounting via `cy.destroy()`, zero dependency on outdated React wrapper getters, and full interactive control over zoom, pan, fit, reset, and tap events.
