import https from 'https';
import fetch, { Response } from 'node-fetch';
import {
  config,
  deviceDefinitions,
  IDeviceDefinition,
  IBrightnessMode,
} from './config.js';
import { getLightServiceCert } from './secrets.js';

let httpsAgent: https.Agent;

const lightsServiceHeaders = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
};

async function createHttpsAgent(): Promise<void> {
  const cert = await getLightServiceCert();
  const options = {
    cert: cert.cert,
    key: cert.key,
    keepAlive: false,
  };
  httpsAgent = new https.Agent(options);
}

interface PopulatedResponse extends Response {
  populatedBody: unknown | string;
}

async function fetchPopulateBody(
  url: string,
  opts?: object,
): Promise<PopulatedResponse> {
  if (!httpsAgent) {
    await createHttpsAgent();
  }
  const resp = (await fetch(url, {
    ...opts,
    agent: httpsAgent,
  })) as PopulatedResponse;
  const contentType = resp.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    resp.populatedBody = await resp.json();
  } else {
    resp.populatedBody = await resp.text();
  }
  return resp;
}

export async function switchPowerOn(
  roomName: string,
  isGroup?: boolean,
): Promise<void> {
  const resp = await fetchPopulateBody(
    `${config.lightsServiceApiUrl}/${
      isGroup ? 'group' : 'room'
    }/${roomName}/power`,
    {
      headers: lightsServiceHeaders,
      method: 'PUT',
      body: JSON.stringify({ on: true }),
    },
  );
  if (!resp.ok) {
    throw new Error('failed to set power');
  }
}

export async function switchPowerOff(
  roomName: string,
  isGroup?: boolean,
): Promise<void> {
  const resp = await fetchPopulateBody(
    `${config.lightsServiceApiUrl}/${
      isGroup ? 'group' : 'room'
    }/${roomName}/power`,
    {
      headers: lightsServiceHeaders,
      method: 'PUT',
      body: JSON.stringify({ on: false }),
    },
  );
  if (!resp.ok) {
    throw new Error('failed to set power');
  }
}

export async function setRoomGroupLevel(
  roomGroupName: string,
  level: number,
): Promise<void> {
  const resp = await fetchPopulateBody(
    `${config.lightsServiceApiUrl}/group/${roomGroupName}/brightnessLevel/${level}`,
    {
      headers: lightsServiceHeaders,
      method: 'PUT',
      body: JSON.stringify({ on: false }),
    },
  );
  if (!resp.ok) {
    throw new Error('failed to set power');
  }
}

export async function setNextRoomGroupLevel(
  roomGroupName: string,
  increase?: boolean,
): Promise<number> {
  const resp = await fetchPopulateBody(
    `${config.lightsServiceApiUrl}/group/${roomGroupName}/${
      increase ? 'brightnessLevelIncrease' : 'brightnessLevelDecrease'
    }`,
    {
      headers: lightsServiceHeaders,
      method: 'POST',
    },
  );
  if (!resp.ok) {
    throw new Error('failed to set next brightness level');
  }

  return ((await resp.populatedBody) as { newBrightnessLevel: number })
    .newBrightnessLevel;
}

export async function setRoomBrightness(
  roomName: string,
  brightness: number,
): Promise<void> {
  await switchPowerOn(roomName);
  const resp = await fetchPopulateBody(
    `${config.lightsServiceApiUrl}/room/${roomName}/setBrightness/${brightness}`,
    {
      headers: lightsServiceHeaders,
      method: 'PUT',
    },
  );
  if (!resp.ok) {
    throw new Error('failed to set brightness');
  }
}

export async function setRoomFade(
  roomName: string,
  fade: boolean,
): Promise<void> {
  if (fade) {
    const resp = await fetchPopulateBody(
      `${config.lightsServiceApiUrl}/room/${roomName}/fadeToBlack`,
      {
        headers: lightsServiceHeaders,
        method: 'PUT',
      },
    );
    if (!resp.ok) {
      throw new Error('failed to set fade to black');
    }
  } else {
    const roomState = (await getRoomState(
      roomName,
    )) as LightsService.API.IRegRoomState;
    await setRoomBrightness(roomName, roomState.brightness);
  }
}

export async function getRoomState(
  roomName: string,
): Promise<LightsService.API.IRoomState> {
  const resp = await fetchPopulateBody(
    `${config.lightsServiceApiUrl}/room/${roomName}`,
    {
      headers: lightsServiceHeaders,
      method: 'GET',
    },
  );
  if (!resp.ok) {
    throw new Error('failed to get room state');
  }

  return resp.populatedBody as LightsService.API.IRoomState;
}

export async function getRoomGroupState(
  roomGroupName: string,
): Promise<LightsService.API.IRoomGroupState> {
  const resp = await fetchPopulateBody(
    `${config.lightsServiceApiUrl}/group/${roomGroupName}`,
    {
      headers: lightsServiceHeaders,
      method: 'GET',
    },
  );
  if (!resp.ok) {
    throw new Error('failed to get room group state');
  }

  return resp.populatedBody as LightsService.API.IRoomGroupState;
}

export async function getRoomBrightnessMode(roomName: string): Promise<{
  brightnessModes: IBrightnessMode[];
  brightnessModeIndex: number;
}> {
  const roomState = await getRoomState(roomName);
  if (roomName === 'kitchen') {
    const kitchenRoomState = roomState as LightsService.API.IKitchenRoomState;
    const kitchenDeviceDef = deviceDefinitions.filter(
      (dd) => dd.roomName === 'kitchen',
    )[0];
    const brightnessModes =
      kitchenDeviceDef.brightnessModes as IBrightnessMode[];
    let brightnessModeIndex: number;
    if (kitchenRoomState.spotBrightness > 250) {
      brightnessModeIndex = 2;
    } else if (kitchenRoomState.spotBrightness < 20) {
      brightnessModeIndex = 0;
    } else {
      brightnessModeIndex = 1;
    }
    return {
      brightnessModes,
      brightnessModeIndex,
    };
  } else {
    throw new Error(`cannot get brightness mode for room ${roomName}`);
  }
}

export async function setRoomBrightnessMode(
  roomName: string,
  modeName: string,
): Promise<void> {
  const deviceDef = deviceDefinitions.filter(
    (dd) => dd.roomName === roomName,
  )[0];
  if (!deviceDef) {
    throw new Error(
      `unable to find device definition for roomName: ${roomName}`,
    );
  }
  const brightnessModes = deviceDef.brightnessModes;
  if (!brightnessModes) {
    throw new Error(
      `device definition ${deviceDef.roomName} does not have brightness modes`,
    );
  }
  const brightnessMode = brightnessModes.filter(
    (bm) => bm.modeName === modeName,
  )[0];
  if (!brightnessMode) {
    throw new Error(`could not find brightness mode ${modeName}`);
  }
  await switchPowerOn(roomName);
  await setRoomBrightness(roomName, brightnessMode.brightnessValue);
}

export async function setRoomFadeMode(
  roomName: string,
  modeName: string,
): Promise<void> {
  const deviceDef = deviceDefinitions.filter(
    (dd) => dd.roomName === roomName,
  )[0];
  if (!deviceDef) {
    throw new Error(
      `unable to find device definition for roomName: ${roomName}`,
    );
  }

  if (!deviceDef.brightnessRangeControl) {
    throw new Error(
      `device definition ${deviceDef.roomName} does not have fade modes`,
    );
  }

  await setRoomFade(roomName, modeName === 'fade');
}

export async function setNextRoomBrightnessMode(
  roomName: string,
  modeDelta: number,
): Promise<string> {
  const { brightnessModes, brightnessModeIndex } = await getRoomBrightnessMode(
    roomName,
  );
  let newBrightnessModeIndex = brightnessModeIndex + modeDelta;
  if (newBrightnessModeIndex >= brightnessModes.length) {
    newBrightnessModeIndex = brightnessModes.length - 1;
  } else if (newBrightnessModeIndex < 0) {
    newBrightnessModeIndex = 0;
  }

  const newBrightnessMode = brightnessModes[newBrightnessModeIndex];
  const newBrightnessModeName = newBrightnessMode.modeName;
  await switchPowerOn(roomName);
  await setRoomBrightnessMode(roomName, newBrightnessModeName);
  return newBrightnessModeName;
}

type DevicesByEndpointId = Record<string, IDeviceDefinition | undefined>;

export function getRoomNameFromEndpointId(endpointId: string): {
  name: string | undefined;
  type: 'room' | 'group' | undefined;
} {
  const devicesByEndpointId = deviceDefinitions.reduce(
    (
      devices: DevicesByEndpointId,
      d: IDeviceDefinition,
    ): DevicesByEndpointId => {
      devices[d.endpointId] = d;
      return devices;
    },
    {},
  );

  const roomName = devicesByEndpointId[endpointId]?.roomName;
  const roomGroupName = devicesByEndpointId[endpointId]?.roomGroupName;

  if (roomName) {
    return {
      name: roomName,
      type: 'room',
    };
  } else if (roomGroupName) {
    return {
      name: roomGroupName,
      type: 'group',
    };
  } else {
    return {
      name: undefined,
      type: undefined,
    };
  }
}

export async function setRoomGroupBrightnessLevel(
  roomGroupName: string,
  levelName: string,
): Promise<void> {
  const deviceDef = deviceDefinitions.filter(
    (dd) => dd.roomGroupName === roomGroupName,
  )[0];
  if (!deviceDef) {
    throw new Error(
      `unable to find device definition for roomGroupName: ${roomGroupName}`,
    );
  }
  const brightnessLevels = deviceDef.brightnessLevels;
  if (!brightnessLevels) {
    throw new Error(
      `device definition ${deviceDef.roomGroupName} does not have brightness levels`,
    );
  }
  const brightnessLevel = brightnessLevels.filter(
    (bm) => bm.levelName === levelName,
  )[0];
  if (!brightnessLevel) {
    throw new Error(`could not find brightness level ${levelName}`);
  }
  await setRoomGroupLevel(roomGroupName, brightnessLevel.level);
}

export async function setNextRoomGroupBrightnessLevel(
  roomGroupName: string,
  modeDelta: number,
): Promise<string> {
  const deviceDef = deviceDefinitions.filter(
    (dd) => dd.roomGroupName === roomGroupName,
  )[0];
  if (!deviceDef) {
    throw new Error(
      `unable to find device definition for roomGroupName: ${roomGroupName}`,
    );
  }
  const brightnessLevels = deviceDef.brightnessLevels;
  if (!brightnessLevels) {
    throw new Error(
      `device definition ${deviceDef.roomGroupName} does not have brightness levels`,
    );
  }

  const levelInd = await setNextRoomGroupLevel(roomGroupName, modeDelta > 0);

  const brightnessLevel = brightnessLevels[levelInd];

  return brightnessLevel.levelName;
}
