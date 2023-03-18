import chalk from "chalk";

export function colorIt(str: string, state: 'good' | 'bad' | 'single' | 'neutral') {
  switch (state) {
    case 'good':
      return chalk.greenBright(str);
    case 'bad':
      return chalk.redBright(str);
    case 'single':
      return chalk.yellowBright(str);
    case 'neutral':
      return chalk.white(str);
  }
}

export function ssk(str: string) {
  return chalk.bgYellowBright.black(str);
}