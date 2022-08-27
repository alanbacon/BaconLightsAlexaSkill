import https from 'https';
import fetch, { Response } from 'node-fetch';
import { config } from './config.js';
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
  opts?,
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

export async function getRoomState(
  roomName: string,
): Promise<LightsService.API.RoomState> {
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

  return resp.populatedBody as LightsService.API.RoomState;
}
