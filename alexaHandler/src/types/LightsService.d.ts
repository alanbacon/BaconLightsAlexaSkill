declare namespace LightsService.API {
  export interface IRoomStateBase {
    on: boolean;
    _name: string;
  }

  export type IRoomState = IRegRoomState | IKitchenRoomState;

  export interface IRegRoomState extends IRoomStateBase {
    brightness: number;
    _autoBrightnessActive: boolean;
  }

  export interface IKitchenRoomState extends IRoomStateBase {
    spotBrightness: number;
  }

  export interface IRoomGroupState {
    on: boolean;
    brightnessLevelMin: number;
    brightnessLevelMax: number;
    numBrightnessLevels: number;
  }
}
