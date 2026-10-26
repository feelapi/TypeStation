/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import "@bentley/icons-generic-webfont/dist/bentley-icons-generic-webfont.css";
import { GuidString, ProcessDetector } from "@itwin/core-bentley";
import { ElectronApp, ElectronAppOpts } from "./ElectronApp";
import { FrontendDevTools } from "@itwin/frontend-devtools";
import { HyperModeling } from "@itwin/hypermodeling-frontend";
import {
  IModelReadRpcInterface, IModelTileRpcInterface, SnapshotIModelRpcInterface,
} from "@itwin/core-common";
import { EditTools } from "@itwin/editor-frontend";
import {
  AccuDrawHintBuilder, AccuDrawShortcuts, AccuSnap, IModelApp, IpcApp, LocalhostIpcApp, LocalHostIpcAppOpts, RenderSystem, RotationMode, SelectionTool, SnapMode,
  TileAdmin, Tool, ToolAdmin,
} from "@itwin/core-frontend";

import { DtaConfiguration } from "../common/DtaConfiguration";
import { dtaChannel, DtaIpcInterface } from "../common/DtaIpcInterface";
import { DtaRpcInterface } from "../common/DtaRpcInterface";
import { ToggleAspectRatioSkewDecoratorTool } from "./AspectRatioSkewDecorator";
import { ApplyModelDisplayScaleTool } from "./DisplayScale";
import { ApplyModelTransformTool } from "./DisplayTransform";
import { GenerateElementGraphicsTool, GenerateTileContentTool } from "./TileContentTool";
import { ViewClipByElementGeometryTool } from "./ViewClipByElementGeometryTool";
import { DrawingAidTestTool } from "./DrawingAidTestTool";
import { EditingScopeTool, PlaceLineStringTool } from "./EditingTools";
import { FenceClassifySelectedTool } from "./Fence";
import { RecordFpsTool } from "./FpsMonitor";
import { FrameStatsTool } from "./FrameStatsTool";
import { ChangeGridSettingsTool } from "./Grid";
import { IncidentMarkerDemoTool } from "./IncidentMarkerDemo";
import { MarkupSelectTestTool } from "./MarkupSelectTestTool";
import { Notifications } from "./Notifications";
import { OutputShadersTool } from "./OutputShadersTool";
import { PathDecorationTestTool } from "./PathDecorationTest";
import { GltfDecorationTool } from "./GltfDecoration";
import { ToggleShadowMapTilesTool } from "./ShadowMapDecoration";
import {
  CloneViewportTool, CloseIModelTool, CloseWindowTool, CreateWindowTool, DockWindowTool, FocusWindowTool, MaximizeWindowTool, OpenIModelTool,
  ReopenIModelTool, ResizeWindowTool, RestoreWindowTool, Surface,
} from "./Surface";
import { SyncViewportFrustaTool, SyncViewportsTool } from "./SyncViewportsTool";
import { TimePointComparisonTool } from "./TimePointComparison";
import { UiManager } from "./UiManager";
import { MarkupTool, ModelClipTool, ZoomToSelectedElementsTool } from "./Viewer";
import { MacroTool } from "./MacroTools";
import { RecordTileSizesTool } from "./TileSizeRecorder";
import { TerrainDrapeTool } from "./TerrainDrapeTool";
import { SaveImageTool } from "./SaveImageTool";
import { BingTerrainMeshProvider } from "./BingTerrainProvider";
import { AttachCustomRealityDataTool, registerRealityDataSourceProvider } from "./RealityDataProvider";
import { MapLayersFormats } from "@itwin/map-layers-formats";
import { OpenRealityModelSettingsTool } from "./RealityModelDisplaySettingsWidget";
import { ITwinLocalization } from "@itwin/core-i18n";
import { signIn, signOut } from "./signIn";

class TypeStationAccuSnap extends AccuSnap {
  private readonly _activeSnaps: SnapMode[] = [SnapMode.NearestKeypoint];

  public override get keypointDivisor() { return 2; }
  public override getActiveSnapModes(): SnapMode[] { return this._activeSnaps; }
  public setActiveSnapModes(snaps: SnapMode[]): void {
    this._activeSnaps.length = snaps.length;
    for (let i = 0; i < snaps.length; i++)
      this._activeSnaps[i] = snaps[i];
  }
}

class TypeStationToolAdmin extends ToolAdmin {
  /**
   * Process shortcut key events.
   * @note iTwin.js 5.0 removed `AccuDrawShortcuts.processShortcutKey`, so the key handling it used to
   * perform is implemented here.
   */
  public override async processShortcutKey(keyEvent: KeyboardEvent, wentDown: boolean): Promise<boolean> {
    if (!wentDown || !AccuDrawHintBuilder.isEnabled)
      return false;

    switch (keyEvent.key.toLowerCase()) {
      case "enter":
        AccuDrawShortcuts.lockSmart();
        return true;
      case "x":
        AccuDrawShortcuts.lockX();
        return true;
      case "y":
        AccuDrawShortcuts.lockY();
        return true;
      case "z":
        AccuDrawShortcuts.lockZ();
        return true;
      case "a":
        AccuDrawShortcuts.lockAngle();
        return true;
      case "d":
        AccuDrawShortcuts.lockDistance();
        return true;
      case "m":
        AccuDrawShortcuts.changeCompassMode();
        return true;
      case "t":
        AccuDrawShortcuts.setStandardRotation(RotationMode.Top);
        return true;
      case "f":
        AccuDrawShortcuts.setStandardRotation(RotationMode.Front);
        return true;
      case "s":
        AccuDrawShortcuts.setStandardRotation(RotationMode.Side);
        return true;
      case "v":
        AccuDrawShortcuts.setStandardRotation(RotationMode.View);
        return true;
      case "o":
        AccuDrawShortcuts.setOrigin();
        return true;
      case "c":
        AccuDrawShortcuts.rotateCycle();
        return true;
      case "q":
        return AccuDrawShortcuts.rotateAxes(true);
      case "e":
        return AccuDrawShortcuts.rotateToElement();
      case "r":
        return AccuDrawShortcuts.defineACSByPoints();
    }

    return false;
  }
}

class SVTSelectionTool extends SelectionTool {
  public static override toolId = "SVTSelect";
  protected override initSelectTool() {
    super.initSelectTool();

    // ###TODO Want to do this only if version comparison enabled, but meh.
    IModelApp.locateManager.options.allowExternalIModels = true;
  }
}

class SignInTool extends Tool {
  public static override toolId = "SignIn";
  public override async run(): Promise<boolean> {
    await signIn();
    return true;
  }
}

class SignOutTool extends Tool {
  public static override toolId = "SignOut";
  public override async run(): Promise<boolean> {
    await signOut();
    return true;
  }
}

class PushChangesTool extends Tool {
  public static override toolId = "PushChanges";
  public static override get maxArgs() { return 1; }
  public static override get minArgs() { return 1; }

  public override async run(description?: string): Promise<boolean> {
    if (!description || "string" !== typeof description)
      return false;

    const imodel = IModelApp.viewManager.selectedView?.iModel;
    if (!imodel || !imodel.isBriefcaseConnection())
      return false;

    await imodel.pushChanges(description);
    return true;
  }

  public override async parseAndRun(...args: string[]): Promise<boolean> {
    return this.run(args[0]);
  }
}

class PullChangesTool extends Tool {
  public static override toolId = "PullChanges";

  public override async run(): Promise<boolean> {
    const imodel = IModelApp.viewManager.selectedView?.iModel;
    if (!imodel || !imodel.isBriefcaseConnection())
      return false;

    await imodel.pullChanges();
    return true;
  }
}

export const dtaIpc = IpcApp.makeIpcProxy<DtaIpcInterface>(dtaChannel);

class RefreshTilesTool extends Tool {
  public static override toolId = "RefreshTiles";
  public static override get maxArgs() { return undefined; }

  public override async run(changedModelIds?: string[]): Promise<boolean> {
    if (undefined !== changedModelIds && 0 === changedModelIds.length)
      changedModelIds = undefined;

    IModelApp.viewManager.refreshForModifiedModels(changedModelIds);
    return true;
  }

  public override async parseAndRun(...args: string[]): Promise<boolean> {
    return this.run(args);
  }
}

class PurgeTileTreesTool extends Tool {
  public static override toolId = "PurgeTileTrees";
  public static override get minArgs() { return 0; }
  public static override get maxArgs() { return undefined; }

  public override async run(modelIds?: string[]): Promise<boolean> {
    const vp = IModelApp.viewManager.selectedView;
    if (undefined === vp)
      return true;

    if (undefined !== modelIds && 0 === modelIds.length)
      modelIds = undefined;

    await vp.iModel.tiles.purgeTileTrees(modelIds);
    IModelApp.viewManager.refreshForModifiedModels(modelIds);

    return true;
  }

  public override async parseAndRun(...args: string[]): Promise<boolean> {
    return this.run(args);
  }
}

class ShutDownTool extends Tool {
  public static override toolId = "ShutDown";

  public override async run(_args: any[]): Promise<boolean> {
    TypeStation.surface.closeAllViewers();
    const app = ElectronApp.isValid ? ElectronApp : IModelApp;
    await app.shutdown();

    debugger; // eslint-disable-line no-debugger
    return true;
  }
}

class ExitTool extends Tool {
  public static override toolId = "Exit";

  public override async run(_args: any[]): Promise<boolean> {
    TypeStation.surface.closeAllViewers();
    await DtaRpcInterface.getClient().terminate();
    return true;
  }
}


export class TypeStation {
  private static _surface?: Surface;
  public static get surface() { return this._surface!; }
  public static set surface(surface: Surface) { this._surface = surface; }
  private static _iTwinId?: GuidString;
  public static get iTwinId(): GuidString | undefined { return this._iTwinId; }

  public static async startup(configuration: DtaConfiguration, renderSys: RenderSystem.Options, tileAdmin: TileAdmin.Props): Promise<void> {
    let socketUrl = new URL(configuration.customOrchestratorUri || "http://localhost:3001");
    socketUrl = LocalhostIpcApp.buildUrlForSocket(socketUrl);
    const opts: ElectronAppOpts | LocalHostIpcAppOpts = {
      iModelApp: {
        accuSnap: new TypeStationAccuSnap(),
        notifications: new Notifications(),
        tileAdmin,
        toolAdmin: new TypeStationToolAdmin(),
        uiAdmin: new UiManager(),
        renderSys,
        rpcInterfaces: [
          DtaRpcInterface,
          IModelReadRpcInterface,
          IModelTileRpcInterface,
          SnapshotIModelRpcInterface, // eslint-disable-line @typescript-eslint/no-deprecated -- this app implements its own Electron RPC transport
        ],
        /* eslint-disable @typescript-eslint/naming-convention */
        mapLayerOptions: {
          MapboxImagery: configuration.mapBoxKey
            ? { key: "access_token", value: configuration.mapBoxKey }
            : undefined,
          BingMaps: configuration.bingMapsKey
            ? { key: "key", value: configuration.bingMapsKey }
            : undefined,
        },

        localization: new ITwinLocalization({ detectorOptions: { order: ["htmlTag"] } }),
      },
      localhostIpcApp: {
        socketUrl,
      },
    };

    this._iTwinId = configuration.iTwinId;

    if (ProcessDetector.isElectronAppFrontend) {
      await ElectronApp.startup(opts);
    }

    IModelApp.applicationLogoCard =
      () => IModelApp.makeLogoCard({ iconSrc: "DTA.png", iconWidth: 100, heading: "TypeStation", notice: "A CAD Software" });

    const svtToolNamespace = "SVTTools";
    await IModelApp.localization.registerNamespace(svtToolNamespace);
    [
      ApplyModelDisplayScaleTool,
      ApplyModelTransformTool,
      AttachCustomRealityDataTool,
      ChangeGridSettingsTool,
      CloneViewportTool,
      CloseIModelTool,
      CloseWindowTool,
      CreateWindowTool,
      DockWindowTool,
      DrawingAidTestTool,
      EditingScopeTool,
      ExitTool,
      FenceClassifySelectedTool,
      FocusWindowTool,
      FrameStatsTool,
      GenerateElementGraphicsTool,
      GenerateTileContentTool,
      GltfDecorationTool,
      IncidentMarkerDemoTool,
      PathDecorationTestTool,
      MacroTool,
      MarkupSelectTestTool,
      MarkupTool,
      MaximizeWindowTool,
      ModelClipTool,
      OpenIModelTool,
      OpenRealityModelSettingsTool,
      OutputShadersTool,
      PlaceLineStringTool,
      PullChangesTool,
      PushChangesTool,
      PurgeTileTreesTool,
      RecordFpsTool,
      RecordTileSizesTool,
      RefreshTilesTool,
      ReopenIModelTool,
      ResizeWindowTool,
      RestoreWindowTool,
      SaveImageTool,
      ShutDownTool,
      SignInTool,
      SignOutTool,
      SVTSelectionTool,
      SyncViewportFrustaTool,
      SyncViewportsTool,
      TerrainDrapeTool,
      ToggleAspectRatioSkewDecoratorTool,
      TimePointComparisonTool,
      ToggleShadowMapTilesTool,
      ViewClipByElementGeometryTool,
      ZoomToSelectedElementsTool,
    ].forEach((tool) => tool.register(svtToolNamespace));

    IModelApp.toolAdmin.defaultToolId = SVTSelectionTool.toolId;

    BingTerrainMeshProvider.register();

    const realityApiKey = process.env.IMJS_REALITY_DATA_KEY;
    if (realityApiKey)
      registerRealityDataSourceProvider(realityApiKey);

    await FrontendDevTools.initialize();
    await HyperModeling.initialize();
    await EditTools.initialize();
    await MapLayersFormats.initialize();
  }

  public static setActiveSnapModes(snaps: SnapMode[]): void {
    (IModelApp.accuSnap as TypeStationAccuSnap).setActiveSnapModes(snaps);
  }

  public static setActiveSnapMode(snap: SnapMode): void { this.setActiveSnapModes([snap]); }
}
