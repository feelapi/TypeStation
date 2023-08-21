/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import * as fs from "fs";
import * as path from "path";
import { Logger, LogLevel, ProcessDetector } from "@itwin/core-bentley";
import { ElectronHost, ElectronHostOptions } from "./ElectronHost";
import { IModelHost, IModelHostOptions, LocalhostIpcHost } from "@itwin/core-backend";
import { IModelReadRpcInterface, IModelTileRpcInterface, RpcInterfaceDefinition, RpcManager, SnapshotIModelRpcInterface } from "@itwin/core-common";
import { DtaConfiguration, getConfig } from "../common/DtaConfiguration";
import { DtaRpcInterface } from "../common/DtaRpcInterface";
import { EditCommandAdmin } from "@itwin/editor-backend";
import * as editorBuiltInCommands from "@itwin/editor-backend";

/** Loads the provided `.env` file into process.env */
function loadEnv(envFile: string) {
  if (!fs.existsSync(envFile))
    return;

  const dotenv = require("dotenv"); // eslint-disable-line @typescript-eslint/no-var-requires
  const dotenvExpand = require("dotenv-expand"); // eslint-disable-line @typescript-eslint/no-var-requires
  const envResult = dotenv.config({ path: envFile });
  if (envResult.error) {
    throw envResult.error;
  }

  dotenvExpand(envResult);
}

class TypeStationRpc extends DtaRpcInterface {

  public override async readExternalSavedViews(bimFileName: string): Promise<string> {
    const esvFileName = this.createEsvFilename(bimFileName);
    if (!fs.existsSync(esvFileName))
      return "";

    const jsonStr = fs.readFileSync(esvFileName).toString();
    return jsonStr ?? "";
  }

  public override async writeExternalSavedViews(bimFileName: string, namedViews: string): Promise<void> {
    const esvFileName = this.createEsvFilename(bimFileName);
    return this.writeExternalFile(esvFileName, namedViews);
  }

  public override async readExternalCameraPaths(bimFileName: string): Promise<string> {
    const cameraPathsFileName = this.createCameraPathsFilename(bimFileName);
    if (!fs.existsSync(cameraPathsFileName))
      return "";

    const jsonStr = fs.readFileSync(cameraPathsFileName).toString();
    return jsonStr ?? "";
  }

  public override async writeExternalCameraPaths(bimFileName: string, cameraPaths: string): Promise<void> {
    const cameraPathsFileName = this.createCameraPathsFilename(bimFileName);
    return this.writeExternalFile(cameraPathsFileName, cameraPaths);
  }

  public override async readExternalFile(txtFileName: string): Promise<string> {
    const dataFileName = this.createTxtFilename(txtFileName);
    if (!fs.existsSync(dataFileName))
      return "";

    const contents = fs.readFileSync(dataFileName).toString();
    return contents ?? "";
  }

  public override async writeExternalFile(fileName: string, content: string): Promise<void> {
    const filePath = this.getFilePath(fileName);
    if (!fs.existsSync(filePath))
      this.createFilePath(filePath);

    if (fs.existsSync(fileName))
      fs.unlinkSync(fileName);

    fs.writeFileSync(fileName, content);
  }

  private createFilePath(filePath: string) {
    const files = filePath.split(/\/|\\/); // /\.[^/.]+$/ // /\/[^\/]+$/
    let curFile = "";
    for (const file of files) {
      if (file === "")
        break;

      curFile += `${file}\\`;
      if (!fs.existsSync(curFile))
        fs.mkdirSync(curFile);
    }
  }

  private getFilePath(fileName: string): string {
    const slashIndex = fileName.lastIndexOf("/");
    const backSlashIndex = fileName.lastIndexOf("\\");
    if (slashIndex > backSlashIndex)
      return fileName.substring(0, slashIndex);
    else
      return fileName.substring(0, backSlashIndex);
  }

  private createEsvFilename(fileName: string): string {
    const dotIndex = fileName.lastIndexOf(".");
    if (-1 !== dotIndex)
      return `${fileName.substring(0, dotIndex)}_ESV.json`;
    return `${fileName}.sv`;
  }

  private createCameraPathsFilename(fileName: string): string {
    const dotIndex = fileName.lastIndexOf(".");
    if (-1 !== dotIndex)
      return `${fileName.substring(0, dotIndex)}_cameraPaths.json`;
    return `${fileName}.cameraPaths.json`;
  }

  private createTxtFilename(fileName: string): string {
    const dotIndex = fileName.lastIndexOf(".");
    if (-1 === dotIndex)
      return `${fileName}.txt`;
    return fileName;
  }

  public override async getEnvConfig(): Promise<DtaConfiguration> {
    return getConfig();
  }

  public override async terminate() {
    await IModelHost.shutdown();

    // Electron only
    try {
      const { app } = require("electron"); // eslint-disable-line @typescript-eslint/no-var-requires
      if (app !== undefined)
        app.exit();
    } catch {

    }

    // Browser only
    if (DtaRpcInterface.backendServer)
      DtaRpcInterface.backendServer.close();
  }
}

export const getRpcInterfaces = (): RpcInterfaceDefinition[] => {
  const rpcs: RpcInterfaceDefinition[] = [
    DtaRpcInterface,
    IModelReadRpcInterface,
    IModelTileRpcInterface,
    SnapshotIModelRpcInterface,
  ];

  return rpcs;
};

export const loadBackendConfig = (): DtaConfiguration => {
  loadEnv(path.join(__dirname, "..", "..", ".env"));
  loadEnv(path.join(__dirname, "..", "..", ".env.local"));

  return getConfig();
};

export const initializeDtaBackend = async (hostOpts?: ElectronHostOptions) => {
  const dtaConfig = loadBackendConfig();

  let logLevel = LogLevel.None;
  if (undefined !== dtaConfig.logLevel)
    logLevel = Logger.parseLogLevel(dtaConfig.logLevel);

  // Set up logging (by default, no logging is enabled)
  Logger.initializeToConsole();
  Logger.setLevelDefault(logLevel);
  Logger.setLevel("SVT", LogLevel.Trace);

  const iModelHost: IModelHostOptions = {
    logTileLoadTimeThreshold: 3,
    logTileSizeThreshold: 500000,
    cacheDir: process.env.IMJS_BRIEFCASE_CACHE_LOCATION,
    profileName: "TypeStation"
  };

  const opts = {
    iModelHost,
    electronHost: hostOpts,
    nativeHost: {
      applicationName: "TypeStation",
    },
    localhostIpcHost: {
      noServer: true,
    },
  };

  /** register the implementation of our RPCs. */
  RpcManager.registerImpl(DtaRpcInterface, TypeStationRpc);
  if (ProcessDetector.isElectronAppBackend) {
    await ElectronHost.startup(opts);
    EditCommandAdmin.registerModule(editorBuiltInCommands);
  } else {
    await LocalhostIpcHost.startup(opts);
    EditCommandAdmin.registerModule(editorBuiltInCommands);
  }
};

/**
 * Logs a warning if only some are provided
 * @returns true if all are provided, false if any missing.
 */
function checkEnvVars(...keys: Array<string>): boolean {
  const missing = keys.filter((name) => process.env[name] === undefined);
  if (missing.length === 0) {
    return true;
  }
  if (missing.length < keys.length) { // Some missing, warn
    // eslint-disable-next-line no-console
    console.log(`Skipping auth setup due to missing: ${missing.join(", ")}`);
  }
  return false;
}
