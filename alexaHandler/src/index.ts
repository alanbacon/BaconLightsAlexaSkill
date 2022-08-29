import {
  switchPowerOff,
  switchPowerOn,
  getRoomState,
  getRoomNameFromEndpointId,
} from './utils/lightsService.js';
import {
  generateAcceptGrantResponse,
  generateInvalidAuthCredResponse,
  generateDiscoveryResponse,
  generatePowerUpdateResp,
  generateStateReportResponse,
} from './utils/alexaResponses.js';
import {
  isVerifiedUser,
  generateReturnChannelAccessToken,
} from './utils/amazonProfile.js';

function log(message, message1, message2): void {
  console.log(message + message1 + message2);
}

function cleanseTokenFromRequest(request: Alexa.API.Request): void {
  let bearerToken: string | undefined;
  if (request.directive.header.namespace === 'Alexa.Discovery') {
    bearerToken = request.directive.payload?.scope?.token;
    if (bearerToken) {
      request.directive.payload!.scope!.token = '**** hidden ****';
    }
  } else if (request.directive.header.namespace === 'Alexa.Authorization') {
    bearerToken = request.directive.payload.grantee?.token;
    if (bearerToken) {
      request.directive.payload.grantee!.token = '**** hidden ****';
    }
  } else {
    bearerToken = request.directive.endpoint?.scope?.token;
    if (bearerToken) {
      request.directive.endpoint!.scope!.token = '**** hidden ****';
    }
  }
}

function getBearerTokenFromRequest(request: Alexa.API.Request): string {
  let bearerToken: string;
  if (request.directive.header.namespace === 'Alexa.Discovery') {
    bearerToken = request.directive.payload?.scope?.token || '';
  } else if (request.directive.header.namespace === 'Alexa.Authorization') {
    bearerToken = request.directive.payload.grantee?.token || '';
  } else {
    bearerToken = request.directive.endpoint?.scope?.token || '';
  }

  return bearerToken;
}

export async function handler(
  request: Alexa.API.Request,
  context: Alexa.API.RequestContext,
): Promise<void> {
  console.log(JSON.stringify({ request }, null, 2));

  if (!(await isVerifiedUser(getBearerTokenFromRequest(request)))) {
    const unauthResp = generateInvalidAuthCredResponse();
    context.succeed(unauthResp);
  } else if (
    request.directive.header.namespace === 'Alexa.Discovery' &&
    request.directive.header.name === 'Discover'
  ) {
    log('DEBUG:', 'Discover request ', JSON.stringify(request));
    handleDiscovery(request, context);
  } else if (request.directive.header.namespace === 'Alexa.PowerController') {
    if (
      request.directive.header.name === 'TurnOn' ||
      request.directive.header.name === 'TurnOff'
    ) {
      log('DEBUG:', 'TurnOn or TurnOff Request ', JSON.stringify(request));
      await handlePowerControl(request, context);
    }
  } else if (
    request.directive.header.namespace === 'Alexa' &&
    request.directive.header.name === 'ReportState'
  ) {
    await handleStateReport(request, context);
  } else if (
    request.directive.header.namespace === 'Alexa.Authorization' &&
    request.directive.header.name === 'AcceptGrant'
  ) {
    await handleAuthorization(request, context);
  } else {
    cleanseTokenFromRequest(request);
    log('DEBUG:', 'unhandled request ', JSON.stringify(request));
  }

  async function handleAuthorization(
    request: Alexa.API.Request,
    context: Alexa.API.RequestContext,
  ): Promise<void> {
    // Send the AcceptGrant response
    const bearerToken = getBearerTokenFromRequest(request);
    const requestCode = request.directive.payload.grant?.code || '';
    await generateReturnChannelAccessToken(bearerToken, requestCode);
    context.succeed(generateAcceptGrantResponse());
  }

  function handleDiscovery(
    _request: Alexa.API.Request,
    context: Alexa.API.RequestContext,
  ): void {
    // Send the discovery response
    const resp = generateDiscoveryResponse();
    log('DEBUG', 'Discovery Response: ', JSON.stringify(resp));
    context.succeed(resp);
  }

  async function handlePowerControl(
    request: Alexa.API.Request,
    context: Alexa.API.RequestContext,
  ): Promise<void> {
    // get device ID passed in during discovery
    const requestMethod = request.directive.header.name;
    // get user token pass in request
    const requestToken = getBearerTokenFromRequest(request);
    const endpointId = request.directive.endpoint?.endpointId || '';
    const roomName = getRoomNameFromEndpointId(endpointId);
    if (!roomName) {
      throw new Error('unable to map endpointId to room name');
    }
    let powerResult: 'ON' | 'OFF';

    if (requestMethod === 'TurnOn') {
      // Make the call to your device cloud for control
      // powerResult = stubControlFunctionToYourCloud(endpointId, token, request);
      await switchPowerOn(roomName);
      powerResult = 'ON';
    } else {
      // Make the call to your device cloud for control and check for success
      // powerResult = stubControlFunctionToYourCloud(endpointId, token, request);
      await switchPowerOff(roomName);
      powerResult = 'OFF';
    }
    const response = generatePowerUpdateResp(
      powerResult,
      endpointId,
      requestToken,
    );
    log('DEBUG', 'Alexa.PowerController ', JSON.stringify(response));
    context.succeed(response);
  }

  async function handleStateReport(
    request: Alexa.API.Request,
    context: Alexa.API.RequestContext,
  ): Promise<void> {
    const correlationToken = request.directive.header.messageId;
    const endpointId = request.directive.endpoint?.endpointId || '';
    const roomName = getRoomNameFromEndpointId(endpointId);
    if (!roomName) {
      throw new Error('unable to map endpointId to room name');
    }
    const roomState = await getRoomState(roomName);

    const response = generateStateReportResponse(
      roomState,
      endpointId,
      correlationToken,
    );
    context.succeed(response);
  }
}
