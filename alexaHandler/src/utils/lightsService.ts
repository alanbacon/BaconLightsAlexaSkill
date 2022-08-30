import https from 'https';
import fetch, { Response } from 'node-fetch';
import { config, deviceDefinitions, IDeviceDefinition } from './config.js';
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

export async function switchPowerOn(roomName: string): Promise<void> {
  const resp = await fetchPopulateBody(
    `${config.lightsServiceApiUrl}/room/${roomName}/power`,
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

export async function switchPowerOff(roomName: string): Promise<void> {
  const resp = await fetchPopulateBody(
    `${config.lightsServiceApiUrl}/room/${roomName}/power`,
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

export async function setRoomBrightness(
  roomName: string,
  brightness: number,
): Promise<void> {
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

type DevicesByEndpointId = Record<string, IDeviceDefinition | undefined>;

export function getRoomNameFromEndpointId(
  endpointId: string,
): string | undefined {
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
  return devicesByEndpointId[endpointId]?.roomName;
}
