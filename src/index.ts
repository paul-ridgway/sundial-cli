import { SunsynkApiClient } from 'sunsynk-node-api-client';
import { createPromptModule } from 'inquirer';
import axiosRetry from 'axios-retry';
import chalk from "chalk";
import { sleep } from "./utils/sleep";
import { Icons } from "./utils/icons";
import { FlowPayload } from "sunsynk-node-api-client/lib/types/flow";
import { GenerationUsePayload, PlantsPayload, RealtimeDataPayload } from "sunsynk-node-api-client/lib/types/plants";
import { batteryArrows, gridArrows, loadArrows, pvArrows } from "./utils/arrows";
import { batteryPower, centre, gridPower, loadPower, pvPower, solarToday, watts } from "./utils/text";
import { ssk } from "./utils/colours";
import { Config } from "./utils/config";

const prompt = createPromptModule();



// let username: string
// let password: string;

const config = new Config();

async function start() {
  console.clear();

  let {username, password } = config;

  console.log(chalk.yellowBright("Sundial CLI"));

  const client = new SunsynkApiClient();

  axiosRetry((client as any)._client, { retries: 3, retryDelay: axiosRetry.exponentialDelay });

  client.setRefreshTokenProvider({
    getRefreshToken: () => config.refreshToken || '',
    setRefreshToken: (refreshToken: string) => {
      config.refreshToken = refreshToken;
    }
  });

  async function tryLogin() {
    try {
      return await client.getPlants();
    } catch (e: any) {
      return false;
    }
  }

  async function loginPrompt() {
    while (true) {
      const answers = await prompt([
        {
          type: 'input',
          name: 'username',
          message: 'Username:',
          default: username,
        },
        {
          type: 'password',
          name: 'password',
          message: 'Password:',
          default: password,
        }
      ]);
      username = answers.username;
      password = answers.password;
      config.refreshToken = '';
      client.setCredentials(username!, password!);
      try {
        const plants = await client.getPlants();
        config.username = username;

        const {save} = await prompt([
          {
            type: 'confirm',
            name: 'save',
            message: 'Save credentials (plain text)?',
          }
        ]);
        console.log("Saving credentials", save);
        if (save) {
          config.password = password;
        }
        return plants;
      } catch (e: any) {
        console.error(chalk.redBright("Login failed"), e.message, '. Try again?');
      }
    }
  }

  async function checkCredentials(): Promise<PlantsPayload> {
    
    if (config.refreshToken) {
      console.log("Attempting login with refresh token...");
      let plants = await tryLogin();
      if (plants) {
        return plants;
      }
    }

    if (config.username && config.password) {
      console.log("Attempting login with saved credentials...");
      config.refreshToken = '';
      client.setCredentials(config.username, config.password);
      let plants = await tryLogin();
      if (plants) {
        return plants;
      }
    }

    return await loginPrompt();
  }

  const plants = await checkCredentials();

  if (!plants) {
    console.error(chalk.redBright("Unable to login!"));
    return process.exit(1);
  }

  console.log(chalk.green("Logged in as: %s"), (await client.getUser()).nickname);

  // TODO: Plant select
  console.log("Plants:", plants.infos.length);
  console.log("First plant, ID:", plants.infos[0].id, plants.infos[0].name);

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