import { readFileSync } from "fs";
import { SunsynkApiClient } from 'sunsynk-node-api-client'
import {createPromptModule} from 'inquirer';
import axiosRetry from 'axios-retry';
import chalk from "chalk";

const prompt = createPromptModule();



let username: string
let password: string;

//  = JSON.parse(readFileSync('./credentials.json', 'utf8'));

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

  axiosRetry((client as any)._client, { retries: 3, retryDelay: axiosRetry.exponentialDelay});

  console.log(chalk.green("Logged in as: %s"), (await client.getUser()).data.nickname);
  
  const plants = await client.getPlants();
  console.log("Plants:", plants.data.infos.length);
  console.log("First plant, ID:", plants.data.infos[0].id, plants.data.infos[0].name);

  // console.log("Plant: ", await client.getPlant(plants.data.infos[0].id));
  
  // const flow = await client.getFlow(plants.data.infos[0].id, new Date());
  // console.log("Flow:", JSON.stringify(flow, null, 2));

  // console.log("Generation: ", await client.getGenerationUse(plants.data.infos[0].id));

  // console.log("Realtime", await client.getRealtimeData(plants.data.infos[0].id));

  // // const energy = await client.getEnergyByDay(plants.data.infos[0].id, new Date());
  // // console.log("Energy:", JSON.stringify(energy, null, 2));


  console.log("Finished!");
}

start().catch((err) => console.error('Error running demo:', err));