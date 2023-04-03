import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";

export class Config {
  private readonly _homeFolder = process.env.HOME || process.env.USERPROFILE;
  private readonly _configFolder = `${this._homeFolder}/.config/sundial-cli`;
  private readonly _configFile = `${this._configFolder}/sundial-cli.json`;

  private _refreshToken: string | undefined = undefined;
  private _username: string | undefined = undefined;
  private _password: string | undefined = undefined;

  constructor() {
    this.load();
  }

  get refreshToken(): string | undefined {
    return this._refreshToken;
  }

  set refreshToken(value: string | undefined) {
    this._refreshToken = value;
    this.save();
  }

  get username(): string | undefined {
    return this._username;
  }

  set username(value: string | undefined) {
    this._username = value;
    this.save();
  }

  get password(): string | undefined {
    return this._password;
  }

  set password(value: string | undefined) {
    this._password = value;
    this.save();
  }

  save(): void {
    if (!existsSync(this._configFolder)) {
      mkdirSync(this._configFolder);
    }

    writeFileSync(this._configFile, JSON.stringify({
      refreshToken: this._refreshToken,
      username: this._username,
      password: this._password,

    }, undefined, 2));
  }

  load(): void {
    if (!existsSync(this._configFile)) {
      return;
    }

    const config = JSON.parse(readFileSync(this._configFile, 'utf8'));

    this._refreshToken = config.refreshToken;
    this._username = config.username;
    this._password = config.password;
  }
}