import chalk from "chalk";
import { FlowPayload } from "sunsynk-node-api-client/lib/types/flow";
import { RealtimeDataPayload } from "sunsynk-node-api-client/lib/types/plants";
import { colorIt } from "./colours";

export function centre(str: string, len: number) {
  const pad = Math.ceil((len - str.length) / 2);
  return (''.padStart(pad, ' ') + str + ''.padStart(pad, ' ')).substring(0, len);
}

export function watts(w: number, suffix = 'W', lpad = 0, rpad = 0) {
  return (w.toString() + ' ' + suffix).padStart(lpad, ' ').padEnd(rpad, ' ');
}


export function pvPower(flow: FlowPayload) {
  return colorIt(centre(watts(flow.pvPower, 'W'), 8), flow.pvPower > 0 ? 'good' : 'neutral');
}

export function batteryPower(flow: FlowPayload) {
  const state = flow.batTo ? 'bad' : flow.toBat ? 'good' : 'neutral';
  return colorIt(centre(watts(flow.battPower, 'W'), 8), state);
}

export function loadPower(flow: FlowPayload) {
  return colorIt(centre(watts(flow.loadOrEpsPower), 8), 'single');
}

export function gridPower(flow: FlowPayload) {
  const state = flow.gridTo ? 'bad' : flow.toGrid ? 'good' : 'neutral';
  return colorIt(centre(watts(flow.gridOrMeterPower), 8), state);
}

export function solarToday(real: RealtimeDataPayload) {
  return chalk.blueBright(watts(real.etoday, 'kW', 7, 0));
}