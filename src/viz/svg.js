/** SVG 요소를 만드는 작은 도우미 — dom.js의 el()과 같은 모양으로 쓴다 */
const NS = 'http://www.w3.org/2000/svg';

export function s(spec, attrs = {}, ...children) {
  const [tag, ...classes] = spec.split('.');
  const node = document.createElementNS(NS, tag);
  if (classes.length) node.setAttribute('class', classes.join(' '));
  for (const [key, value] of Object.entries(attrs)) {
    if (value === null || value === undefined || value === false) continue;
    if (key.startsWith('on') && typeof value === 'function') node.addEventListener(key.slice(2), value);
    else node.setAttribute(key, value === true ? '' : String(value));
  }
  for (const child of children.flat(Infinity)) {
    if (child === null || child === undefined || child === false) continue;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return node;
}

/** 직선 눈금 변환기 [d0,d1] → [r0,r1] */
export function scale(d0, d1, r0, r1) {
  const f = (v) => r0 + ((v - d0) / (d1 - d0)) * (r1 - r0);
  f.invert = (p) => d0 + ((p - r0) / (r1 - r0)) * (d1 - d0);
  f.domain = [d0, d1];
  return f;
}

/** 보기 좋은 눈금 값들 */
export function ticks(d0, d1, count = 5) {
  const span = d1 - d0;
  const raw = span / count;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((st) => span / st <= count + 1) ?? pow * 10;
  const out = [];
  for (let v = Math.ceil(d0 / step) * step; v <= d1 + 1e-9; v += step) out.push(Math.round(v * 1e6) / 1e6);
  return out;
}

/** 종(0·1·2)마다 다른 모양 — 색만으로 구분하지 않게(● ▲ ■) */
export function marker(shape, x, y, r, attrs = {}) {
  if (shape === 1) {
    const h = r * 1.25;
    return s('path', { d: `M${x},${y - h} L${x + h},${y + h * 0.8} L${x - h},${y + h * 0.8} Z`, ...attrs });
  }
  if (shape === 2) return s('rect', { x: x - r * 0.9, y: y - r * 0.9, width: r * 1.8, height: r * 1.8, rx: 1.5, ...attrs });
  if (shape === 3) return s('path', { d: `M${x},${y - r * 1.25} L${x + r * 1.25},${y} L${x},${y + r * 1.25} L${x - r * 1.25},${y} Z`, ...attrs });
  return s('circle', { cx: x, cy: y, r, ...attrs });
}
