declare namespace LightsService.API {
  export interface IRoomStateBase {
    on: boolean;
    _name: string;
  }

  export type IRoomState = IRegRoomState | IKitchenRoomState;

  export interface IRegRoomState extends IRoomStateBase {
    brightness: number;
  }

  export interface IKitchenRoomState extends IRoomStateBase {
    spotBrightness: number;
  }
}
