import { readFileSync } from "fs";
import { SunsynkApiClient } from 'sunsynk-node-api-client';
import { createPromptModule } from 'inquirer';
import axiosRetry from 'axios-retry';
import chalk from "chalk";
import ora from 'ora';
import { sleep } from "./utils/sleep";
import { Icons } from "./utils/icons";
import { FlowPayload } from "sunsynk-node-api-client/lib/types/flow";

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

  const plants = await client.getPlants();
  console.log("Plants:", plants.infos.length);
  console.log("First plant, ID:", plants.infos[0].id, plants.infos[0].name);

  console.log("Plant: ", await client.getPlant(plants.infos[0].id));


  console.log("Generation: ", await client.getGenerationUse(plants.infos[0].id));

  function colorIt(str: string, good: boolean, bad: boolean) {
    if (good) {
      return chalk.greenBright(str);
    } else if (bad) {
      return chalk.redBright(str);
    } else {
      return chalk.grey(str);
    }
  }

  function arrows(flow: 'left' | 'right' | 'none') {
    const v = Math.round((Date.now() / 250) % 5);

    let base = '', chr = '', i = 0;
    switch (flow) {
      case 'left':
        base = '◃◃◃◃◃';
        chr = '◂';
        i = 4 - v;
        break;
      case 'right':
        base = '▹▹▹▹▹';
        chr = '▸';
        i = v - 1;
        break;
      case 'none':
        base = '-----';
        chr = '-';
        i = 0;
        break;
    }

    return (base.slice(0, i) + chr + base.slice(i + 1, 5)).substring(0, 5);
  }

  let flow: FlowPayload | null = null;
  let lastUpdate = 0;

  while (true) {
    if (Date.now() - lastUpdate >= 60000) {
      let [realTime, flowData] = await Promise.all([
        client.getRealtimeData(plants.infos[0].id),
        client.getFlow(plants.infos[0].id, new Date()),
      ]);
      flow = flowData;
      lastUpdate = Date.parse(realTime.updateAt);
    }

    if (flow) {
      console.log(chalk.magentaBright('▹▸ ◃◂ ▵▴ ▿▾'));

      let buffer = "";
      
      buffer += chalk.greenBright(flow.pvPower.toString().padStart(4));
      buffer += ` W ${Icons.sun} `;
      buffer += chalk.greenBright(arrows("left"));
      buffer += chalk.whiteBright(' ┏━━━┓ ');
      buffer += chalk.greenBright(arrows('right'));
      buffer+= ` ${Icons.battery} ${flow.battPower} W`;
      buffer += "\n";

      buffer += chalk.whiteBright(`                ┃ I ┃          `);
      buffer += `${flow.soc}%\n`;

      buffer += flow.gridOrMeterPower.toString().padStart(4);
      buffer += ` W ${Icons.plug} `;
      buffer += chalk.greenBright(arrows('none'));
      buffer += chalk.whiteBright(' ┗━━━┛ ');
      buffer += arrows('right');
      buffer += ` ${Icons.house} `;
      buffer += `${flow.loadOrEpsPower} W`;
      buffer += "\n";

      console.clear();
      console.log(buffer);

    }

    await sleep(50);
  }

  // const energy = await client.getEnergyByDay(plants.infos[0].id, new Date());
  // console.log("Energy:", JSON.stringify(energy, null, 2));


  console.log("Finished!");
}

start().catch((err) => console.error('Error running demo:', err));