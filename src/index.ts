import { readFileSync } from "fs";
import { SunsynkApiClient } from 'sunsynk-node-api-client';
import { createPromptModule } from 'inquirer';
import axiosRetry from 'axios-retry';
import chalk from "chalk";
import { sleep } from "./utils/sleep";
import { Icons } from "./utils/icons";
import { FlowPayload } from "sunsynk-node-api-client/lib/types/flow";
import { GenerationUsePayload, RealtimeDataPayload } from "sunsynk-node-api-client/lib/types/plants";
import { batteryArrows, gridArrows, loadArrows, pvArrows } from "./utils/arrows";
import { centre, watts } from "./utils/text";
import { colorIt, ssk } from "./utils/colours";

const prompt = createPromptModule();



// let username: string
// let password: string;

let { username, password } = JSON.parse(readFileSync('./credentials.json', 'utf8'));

async function start() {
  console.clear();


  console.log(chalk.yellowBright("Sundial CLI"));

  if (!username || !password) {
    const answers = await prompt([
      {
        type: 'input',
        name: 'username',
        message: 'Username:',
      },
      {
        type: 'password',
        name: 'password',
        message: 'Password:',
      }
    ]);
    username = answers.username;
    password = answers.password;
  }

  const client = new SunsynkApiClient(username, password);

  axiosRetry((client as any)._client, { retries: 3, retryDelay: axiosRetry.exponentialDelay });

  console.log(chalk.green("Logged in as: %s"), (await client.getUser()).nickname);

  // TODO: Plant select
  const plants = await client.getPlants();
  console.log("Plants:", plants.infos.length);
  console.log("First plant, ID:", plants.infos[0].id, plants.infos[0].name);

  function pvPower(flow: FlowPayload) {
    return colorIt(centre(watts(flow.pvPower, 'W'), 8), flow.pvPower > 0 ? 'good' : 'neutral');
  }

  function batteryPower(flow: FlowPayload) {
    const state = flow.batTo ? 'bad' : flow.toBat ? 'good' : 'neutral';
    return colorIt(centre(watts(flow.battPower, 'W'), 8), state);
  }

  function loadPower(flow: FlowPayload) {
    return colorIt(centre(watts(flow.loadOrEpsPower), 8), 'single');
  }

  function gridPower(flow: FlowPayload) {
    const state = flow.gridTo ? 'bad' : flow.toGrid ? 'good' : 'neutral';
    return colorIt(centre(watts(flow.gridOrMeterPower), 8), state);
  }

  function solarToday(real: RealtimeDataPayload) {
    return chalk.blueBright(watts(real.etoday, 'kW', 7, 0));
  }

  let real: RealtimeDataPayload | null = null;
  let flow: FlowPayload | null = null;
  let gen: GenerationUsePayload | null = null;
  let lastUpdate = 0;

  while (true) {
    // TODO: Switch to timers?
    if (Date.now() - lastUpdate >= 60000) {
      let [realTime, flowData, genData] = await Promise.all([
        client.getRealtimeData(plants.infos[0].id),
        client.getFlow(plants.infos[0].id, new Date()),
        client.getGenerationUse(plants.infos[0].id)
      ]);
      flow = flowData;
      real = realTime;
      gen = genData;
      lastUpdate = Date.parse(realTime.updateAt);
    }

    if (flow && real) {
      const rows = [
        `            ${pvPower(flow)} ${ssk('┏━━━━━┓')} ${batteryPower(flow)}`,
        ` ${solarToday(real)} ${Icons.sun} ${pvArrows(flow)} ${ssk('┃  I  ┃')} ${batteryArrows(flow)} ${Icons.battery} ${`${flow.soc}%`.padEnd(7, ' ')}`,
        `                     ${ssk('┃  N  ┃')}`,
        `         ${Icons.plug} ${chalk.greenBright(gridArrows(flow))} ${ssk('┃  V  ┃')} ${loadArrows(flow)} ${Icons.house}`,
        `            ${gridPower(flow)} ${ssk('┗━━━━━┛')} ${loadPower(flow)}`
      ];

      console.clear();
      console.log(chalk.bgYellowBright.black.bold(centre('Sundial CLI', 48)));
      console.log('');
      rows.forEach((row) => console.log(row));
      console.log('');
      console.log(chalk.bgYellow.black.bold(centre(real.updateAt, 48)));
    }

    await sleep(100);
  }

}

start().catch((err) => console.error('Error running demo:', err));