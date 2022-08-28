import fetch from 'node-fetch';
import { v4 as uuidV4 } from 'uuid';
import { config } from './config.js';

export async function sendProactiveEvent(
  power: 'ON' | 'OFF',
  accessToken: string,
): Promise<void> {
  const resp = await fetch(config.proactiveEventEndpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      event: {
        header: {
          namespace: 'Alexa',
          name: 'Response',
          messageId: uuidV4(),
          correlationToken: uuidV4(),
          payloadVersion: '3',
        },
        endpoint: {
          scope: {
            type: 'BearerToken',
            token: accessToken,
          },
          endpointId: 'sample-bulb-01',
        },
        payload: {},
      },
      context: {
        properties: [
          {
            namespace: 'Alexa.PowerController',
            name: 'powerState',
            value: power,
            timeOfSample: new Date().toISOString(),
            uncertaintyInMilliseconds: 0,
          },
        ],
      },
    }),
  });

  console.log(resp);

  if (!resp.ok) {
    throw new Error('failed to send proactive event');
  }
}
