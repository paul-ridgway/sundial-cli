import { FlowPayload } from "sunsynk-node-api-client/lib/types/flow";
import { colorIt } from "./colours";

function arrows(flow: 'left' | 'right' | 'none', state: 'good' | 'bad' | 'single' | 'neutral', len = 8) {
  const v = Math.floor((Date.now() / 100) % len);

  let base = '', chr = '', i = 0;
  switch (flow) {
    case 'left':
      base = ''.padStart(len, '◃');
      chr = '◂';
      i = len - 1 - v;
      break;
    case 'right':
      base = ''.padStart(len, '▹');
      chr = '▸';
      i = v;
      break;
    case 'none':
      base = ''.padStart(len, '-');
      chr = '-';
      i = 0;
      break;
  }

  const str = (base.slice(0, i) + chr + base.slice(i + 1, len)).substring(0, len);
  return colorIt(str, state);
}

export function pvArrows(flow: FlowPayload) {
  if (flow?.pvPower > 0) {
    return arrows('right', 'good');
  } else if (flow?.pvPower < 0) {
    return arrows('left', 'bad');
  } else {
    return arrows('none', 'neutral');
  }
}

export function batteryArrows(flow: FlowPayload) {
  if (flow.toBat) {
    return arrows('right', 'good');
  } else if (flow.batTo) {
    return arrows('left', 'bad');
  } else {
    return arrows('none', 'neutral');
  }
}

export function loadArrows(flow: FlowPayload) {
  if (flow.toLoad) {
    return arrows('right', 'single');
  } else {
    return arrows('none', 'neutral');
  }
}

export function gridArrows(flow: FlowPayload) {
  if (flow.toGrid) {
    return arrows('left', 'good');
  } else if (flow.gridTo) {
    return arrows('right', 'bad');
  } else {
    return arrows('none', 'neutral');
  }
}


