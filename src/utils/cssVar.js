// Read a design token at runtime. Canvas charts (ECharts) cannot use
// CSS variables directly, so they read the resolved value with this.
export const cssVar = (name) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim()
