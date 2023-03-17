import { readFileSync } from "fs";
import { SunsynkApiClient } from 'sunsynk-node-api-client';
import { createPromptModule } from 'inquirer';
import axiosRetry from 'axios-retry';
import chalk from "chalk";

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

  console.log(chalk.green("Logged in as: %s"), (await client.getUser()).data.nickname);

  const plants = await client.getPlants();
  console.log("Plants:", plants.data.infos.length);
  console.log("First plant, ID:", plants.data.infos[0].id, plants.data.infos[0].name);

  console.log("Plant: ", await client.getPlant(plants.data.infos[0].id));


  console.log("Generation: ", await client.getGenerationUse(plants.data.infos[0].id));

  function colorIt(str: string, good: boolean, bad: boolean) {
    if (good) {
      return chalk.greenBright(str);
    } else if (bad) {
      return chalk.redBright(str);
    } else {
      return chalk.grey(str);
    }
  }

  let flow;
  let lastUpdate = 0;

  while (true) {
    if (Date.now() - lastUpdate >= 60000) {
      let [realTime, flowData] = await Promise.all([
        client.getRealtimeData(plants.data.infos[0].id),
        client.getFlow(plants.data.infos[0].id, new Date()),
      ]);
      flow = flowData;
      lastUpdate = Date.parse(realTime.data.updateAt);
    }

    if (flow) {
      console.clear();
      console.log(new Date(lastUpdate).toLocaleString());
      console.log();
      console.log(colorIt(`${String.fromCharCode(0xD83D, 0xDD0B)} ${flow.data.soc}% ${flow.data.battPower} W`, flow.data.toBat, flow.data.batTo));
      console.log(colorIt(`${String.fromCharCode(0xD83C, 0xDF1E)} ${flow.data.pvPower} W`, true, false));
      console.log(colorIt(`${String.fromCharCode(0xD83C, 0xDFE0)} ${flow.data.loadOrEpsPower} W`, false, true));
      console.log(colorIt(`${String.fromCharCode(0xD83D, 0xDD0C)} ${flow.data.gridOrMeterPower} W`, flow.data.toGrid, flow.data.gridTo));
    }

    await sleep(1000);
  }

  // const energy = await client.getEnergyByDay(plants.data.infos[0].id, new Date());
  // console.log("Energy:", JSON.stringify(energy, null, 2));


  console.log("Finished!");
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

start().catch((err) => console.error('Error running demo:', err));