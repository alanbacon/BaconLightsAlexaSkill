import { v4 as uuidV4 } from 'uuid';
import { deviceDefinitions, IDeviceDefinition } from './config.js';

function generateAlexaHeader(
  namespace: string,
  name: string,
  correlationToken?: string,
): Alexa.API.Header {
  return {
    namespace,
    name,
    messageId: uuidV4(),
    correlationToken,
    payloadVersion: '3',
  };
}

export function generateInvalidAuthCredResponse(): Alexa.API.Response {
  return {
    event: {
      header: generateAlexaHeader('Alexa', 'ErrorResponse'),
      payload: {
        type: 'INVALID_AUTHORIZATION_CREDENTIAL',
        message: 'you are not authorized to use this skill',
      },
    },
  };
}

export function generateAcceptGrantResponse(): Alexa.API.Response {
  const header = generateAlexaHeader(
    'Alexa.Authorization',
    'AcceptGrant.Response',
  );
  return {
    event: {
      header: header,
      payload: {},
    },
  };
}

function generateDiscoveryObjForDevice(
  device: IDeviceDefinition,
): Alexa.API.EndpointsItem {
  const baseEndpoint: Alexa.API.EndpointsItem = {
    endpointId: device.endpointId,
    friendlyName: device.friendlyName,
    cookie: {},
    description: device.friendlyName,
    additionalAttributes: {
      manufacturer: 'Knotanti',
      model: 'Knotanti Room',
      serialNumber: 'U11112233456',
      firmwareVersion: '1.24.2546',
      softwareVersion: '1.036',
      customIdentifier: 'Sample custom ID',
    },
    manufacturerName: 'Knotanti',
    displayCategories: ['LIGHT'],
    capabilities: [
      {
        interface: 'Alexa.PowerController',
        version: '3',
        type: 'AlexaInterface',
        properties: {
          supported: [
            {
              name: 'powerState',
            },
          ],
          retrievable: true,
          proactivelyReported: true,
        },
      },
      {
        type: 'AlexaInterface',
        interface: 'Alexa.EndpointHealth',
        version: '3.2',
        properties: {
          supported: [
            {
              name: 'connectivity',
            },
          ],
          retrievable: true,
        },
      },
      {
        type: 'AlexaInterface',
        interface: 'Alexa',
        version: '3',
      },
    ],
  };

  return baseEndpoint;
}

export function generateDiscoveryResponse(): Alexa.API.Response {
  return {
    event: {
      header: generateAlexaHeader('Alexa.Discovery', 'Discover.Response'),
      payload: {
        endpoints: deviceDefinitions.map((d) =>
          generateDiscoveryObjForDevice(d),
        ),
      },
    },
  };
}

export function generatePowerUpdateResp(
  powerResult: 'ON' | 'OFF',
  endpointId: string,
  requestToken: string,
): Alexa.API.Response {
  const now = new Date().toISOString();
  const contextResult: Alexa.API.Context = {
    properties: [
      {
        namespace: 'Alexa.PowerController',
        name: 'powerState',
        value: powerResult,
        timeOfSample: now,
        uncertaintyInMilliseconds: 0,
      },
      {
        namespace: 'Alexa.EndpointHealth', // Always include EndpointHealth in your Alexa.Response
        name: 'connectivity',
        value: {
          value: 'OK',
        },
        timeOfSample: now,
        uncertaintyInMilliseconds: 0,
      },
    ],
  };
  return {
    context: contextResult,
    event: {
      header: generateAlexaHeader('Alexa', 'Response'),
      endpoint: {
        scope: {
          type: 'BearerToken',
          token: requestToken,
        },
        endpointId,
      },
      payload: {},
    },
  };
}

export function generateStateReportResponse(
  roomState: LightsService.API.IRoomState,
  endpointId: string,
  correlationToken: string,
): Alexa.API.Response {
  const now = new Date().toISOString();
  return {
    event: {
      header: generateAlexaHeader('Alexa', 'StateReport', correlationToken),
      endpoint: {
        endpointId,
      },
      payload: {},
    },
    context: {
      properties: [
        {
          namespace: 'Alexa.PowerController',
          name: 'powerState',
          value: roomState.on ? 'ON' : 'OFF',
          timeOfSample: now,
          uncertaintyInMilliseconds: 0,
        },
        {
          namespace: 'Alexa.EndpointHealth',
          name: 'connectivity',
          value: {
            value: 'OK',
          },
          timeOfSample: now,
          uncertaintyInMilliseconds: 0,
        },
      ],
    },
  };
}
