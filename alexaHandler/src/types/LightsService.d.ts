declare namespace LightsService.API {
  export type IRoomState = IRegRoomState | IKitchenRoomState;

  export interface IRegRoomState {
    on: boolean;
    brightness: number;
  }

  export interface IKitchenRoomState {
    on: boolean;
  }
}
