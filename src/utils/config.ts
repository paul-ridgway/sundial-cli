import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";

export class Config {
  private readonly _homeFolder = process.env.HOME || process.env.USERPROFILE;
  private readonly _configFolder = `${this._homeFolder}/.config/sundial-cli`;
  private readonly _configFile = `${this._configFolder}/sundial-cli.json`;

  private _refreshToken: string | null = null;
  private _username: string | null = null;
  private _password: string | null = null;

  constructor() {
    this.load();
  }

  get refreshToken(): string | null {
    return this._refreshToken;
  }

  set refreshToken(value: string | null) {
    this._refreshToken = value;
    this.save();
  }

  get username(): string | null {
    return this._username;
  }

  set username(value: string | null) {
    this._username = value;
    this.save();
  }

  get password(): string | null {
    return this._password;
  }

  set password(value: string | null) {
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

    }, null, 2));
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