import { v4 as uuidV4 } from 'uuid';
import {
  deviceDefinitions,
  IDeviceDefinition,
  IBrightnessMode,
} from './config.js';

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
  const capabilities: Alexa.API.CapabilitiesItem[] = [
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
        //proactivelyReported: true,
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
  ];

  if (device.brightnessRangeControl) {
    capabilities.push({
      type: 'AlexaInterface',
      interface: 'Alexa.BrightnessController',
      version: '3',
      properties: {
        supported: [{ name: 'brightness' }],
        //proactivelyReported: true,
        retrievable: true,
      },
      configuration: {
        supportedRange: {
          minimumValue: 5,
          maximumValue: 100,
          precision: 10,
        },
      },
    });
  }

  if (device.brightnessModes) {
    capabilities.push({
      type: 'AlexaInterface',
      interface: 'Alexa.ModeController',
      instance: 'BrightnessMode',
      version: '3',
      properties: {
        supported: [{ name: 'mode' }],
        retrievable: true,
      },
      capabilityResources: {
        friendlyNames: [
          {
            '@type': 'text',
            value: {
              text: 'brightness',
            },
          },
        ],
      },
      configuration: {
        ordered: true,
        supportedModes: device.brightnessModes.map(
          (brightnessMode): Alexa.API.SupportedMode => {
            return {
              value: brightnessMode.modeName,
              modeResources: {
                friendlyNames: brightnessMode.presetNames.map(
                  (presetName): Alexa.API.PresetFriendlyName => {
                    return {
                      '@type': 'text',
                      value: {
                        text: presetName,
                      },
                    };
                  },
                ),
              },
            };
          },
        ),
      },
    });
  }

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
    capabilities,
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

export function generateBrightnessUpdateResp(
  newBrightnessPerc: number,
  messageId: string,
  endpointId: string,
  requestToken: string,
): Alexa.API.Response {
  const now = new Date().toISOString();
  const contextResult: Alexa.API.Context = {
    properties: [
      {
        namespace: 'Alexa.BrightnessController',
        name: 'brightness',
        value: newBrightnessPerc,
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
      header: generateAlexaHeader('Alexa', 'Response', messageId),
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

export function generateBrightnessModeUpdateResp(
  newModeName: string,
  messageId: string,
  endpointId: string,
  requestToken: string,
): Alexa.API.Response {
  const now = new Date().toISOString();
  const contextResult: Alexa.API.Context = {
    properties: [
      {
        namespace: 'Alexa.ModeController',
        name: 'mode',
        instance: 'BrightnessMode',
        value: newModeName,
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
      header: generateAlexaHeader('Alexa', 'Response', messageId),
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
  brightnessMode?: IBrightnessMode,
): Alexa.API.Response {
  const now = new Date().toISOString();

  const properties: Alexa.API.PropertiesItem[] = [
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
  ];

  if ('brightness' in roomState) {
    roomState as LightsService.API.IRegRoomState;
    properties.push({
      namespace: 'Alexa.BrightnessController',
      name: 'brightness',
      value: roomState.brightness * 100,
      timeOfSample: now,
      uncertaintyInMilliseconds: 0,
    });
  } else if (brightnessMode) {
    properties.push({
      namespace: 'Alexa.ModeController',
      instance: 'BrightnessMode',
      name: 'mode',
      value: brightnessMode.modeName,
      timeOfSample: now,
      uncertaintyInMilliseconds: 0,
    });
  }

  const stateResp = {
    event: {
      header: generateAlexaHeader('Alexa', 'StateReport', correlationToken),
      endpoint: {
        endpointId,
      },
      payload: {},
    },
    context: {
      properties,
    },
  };

  return stateResp;
}
