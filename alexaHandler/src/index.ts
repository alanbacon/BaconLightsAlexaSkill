import { v4 as uuidV4 } from 'uuid';
import { getAmazonUserProfile } from './utils/amazonProfile.js';
import { switchPowerOff, switchPowerOn } from './utils/lightsService.js';

async function isVerifiedUser(request: Alexa.API.Request): Promise<boolean> {
  let bearerToken: string;
  if (request.directive.header.namespace === 'Alexa.Discovery') {
    bearerToken = request.directive.payload.scope.token;
  } else {
    bearerToken = request.directive.endpoint.scope.token;
  }

  const verfiedUserEmailAddresses = new Set(['the_resonance@hotmail.com']);
  const userProfile = await getAmazonUserProfile(bearerToken);
  return verfiedUserEmailAddresses.has(userProfile.email);
}

function sendInvalidAuthCredResponse(context): void {
  context.succeed({
    event: {
      header: {
        namespace: 'Alexa',
        name: 'ErrorResponse',
        messageId: uuidV4(),
        payloadVersion: '3',
      },
      payload: {
        type: 'INVALID_AUTHORIZATION_CREDENTIAL',
        message: 'you are not authorized to use this skill',
      },
    },
  });
}

export async function handler(
  request: Alexa.API.Request,
  context,
): Promise<void> {
  console.log(JSON.stringify({ request }, null, 2));

  if (!(await isVerifiedUser(request))) {
    sendInvalidAuthCredResponse(context);
  } else if (
    request.directive.header.namespace === 'Alexa.Discovery' &&
    request.directive.header.name === 'Discover'
  ) {
    log('DEBUG:', 'Discover request', JSON.stringify(request));
    handleDiscovery(request, context);
  } else if (request.directive.header.namespace === 'Alexa.PowerController') {
    if (
      request.directive.header.name === 'TurnOn' ||
      request.directive.header.name === 'TurnOff'
    ) {
      log('DEBUG:', 'TurnOn or TurnOff Request', JSON.stringify(request));
      handlePowerControl(request, context);
    }
  } else if (
    request.directive.header.namespace === 'Alexa.Authorization' &&
    request.directive.header.name === 'AcceptGrant'
  ) {
    handleAuthorization(request, context);
  } else {
    log('DEBUG:', 'unhandled request', JSON.stringify(request));
  }

  function handleAuthorization(request, context) {
    // Send the AcceptGrant response
    const payload = {};
    const header = request.directive.header;
    header.name = 'AcceptGrant.Response';
    log(
      'DEBUG',
      'AcceptGrant Response: ',
      JSON.stringify({ header: header, payload: payload }),
    );
    context.succeed({ event: { header: header, payload: payload } });
  }

  function handleDiscovery(request, context) {
    // Send the discovery response
    const payload = {
      endpoints: [
        {
          endpointId: 'sample-bulb-01',
          manufacturerName: 'Smart Device Company',
          friendlyName: 'Livingroom lamp',
          description: 'Virtual smart light bulb',
          displayCategories: ['LIGHT'],
          additionalAttributes: {
            manufacturer: 'Sample Manufacturer',
            model: 'Sample Model',
            serialNumber: 'U11112233456',
            firmwareVersion: '1.24.2546',
            softwareVersion: '1.036',
            customIdentifier: 'Sample custom ID',
          },
          cookie: {
            key1: 'arbitrary key/value pairs for skill to reference this endpoint.',
            key2: 'There can be multiple entries',
            key3: 'but they should only be used for reference purposes.',
            key4: 'This is not a suitable place to maintain current endpoint state.',
          },
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
        },
      ],
    };
    const header = request.directive.header;
    header.name = 'Discover.Response';
    log(
      'DEBUG',
      'Discovery Response: ',
      JSON.stringify({ header: header, payload: payload }),
    );
    context.succeed({ event: { header: header, payload: payload } });
  }

  function log(message, message1, message2) {
    console.log(message + message1 + message2);
  }

  async function handlePowerControl(request, context): Promise<void> {
    // get device ID passed in during discovery
    const requestMethod = request.directive.header.name;
    const responseHeader = request.directive.header;
    responseHeader.namespace = 'Alexa';
    responseHeader.name = 'Response';
    responseHeader.messageId = responseHeader.messageId + '-R';
    // get user token pass in request
    const requestToken = request.directive.endpoint.scope.token;
    let powerResult;

    if (requestMethod === 'TurnOn') {
      // Make the call to your device cloud for control
      // powerResult = stubControlFunctionToYourCloud(endpointId, token, request);
      await switchPowerOn('study');
      powerResult = 'ON';
    } else if (requestMethod === 'TurnOff') {
      // Make the call to your device cloud for control and check for success
      // powerResult = stubControlFunctionToYourCloud(endpointId, token, request);
      await switchPowerOff('study');
      powerResult = 'OFF';
    }
    // Return the updated powerState.  Always include EndpointHealth in your Alexa.Response
    const contextResult = {
      properties: [
        {
          namespace: 'Alexa.PowerController',
          name: 'powerState',
          value: powerResult,
          timeOfSample: '2017-09-03T16:20:50.52Z', //retrieve from result.
          uncertaintyInMilliseconds: 50,
        },
        {
          namespace: 'Alexa.EndpointHealth',
          name: 'connectivity',
          value: {
            value: 'OK',
          },
          timeOfSample: '2022-03-09T22:43:17.877738+00:00',
          uncertaintyInMilliseconds: 0,
        },
      ],
    };
    const response = {
      context: contextResult,
      event: {
        header: responseHeader,
        endpoint: {
          scope: {
            type: 'BearerToken',
            token: requestToken,
          },
          endpointId: 'sample-bulb-01',
        },
        payload: {},
      },
    };
    log('DEBUG', 'Alexa.PowerController ', JSON.stringify(response));
    context.succeed(response);
  }
}