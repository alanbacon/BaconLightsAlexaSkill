import {
  switchPowerOff,
  switchPowerOn,
  setRoomBrightness,
  getRoomState,
  getRoomNameFromEndpointId,
} from './utils/lightsService.js';
import {
  generateAcceptGrantResponse,
  generateInvalidAuthCredResponse,
  generateDiscoveryResponse,
  generatePowerUpdateResp,
  generateBrightnessUpdateResp,
  generateStateReportResponse,
} from './utils/alexaResponses.js';
import {
  isVerifiedUser,
  generateReturnChannelAccessToken,
} from './utils/amazonProfile.js';

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

async function handleAuthorization(
  request: Alexa.API.Request,
  context: Alexa.API.RequestContext,
): Promise<void> {
  // Send the AcceptGrant response
  const bearerToken = getBearerTokenFromRequest(request);
  const requestCode = request.directive.payload.grant?.code || '';
  await generateReturnChannelAccessToken(bearerToken, requestCode);
  const resp = generateAcceptGrantResponse();
  console.log('DEBUG: ', 'Accept Grant Resp ', JSON.stringify(resp));
  context.succeed(resp);
}

function handleDiscovery(
  _request: Alexa.API.Request,
  context: Alexa.API.RequestContext,
): void {
  // Send the discovery response
  const resp = generateDiscoveryResponse();
  console.log('DEBUG', 'Discovery Response: ', JSON.stringify(resp));
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
  console.log('DEBUG', 'Alexa.PowerController ', JSON.stringify(response));
  context.succeed(response);
}

async function handleBrightnessControl(
  request: Alexa.API.Request,
  context: Alexa.API.RequestContext,
): Promise<void> {
  const messageId = request.directive.header.messageId;
  const requestMethod = request.directive.header.name;
  const requestToken = getBearerTokenFromRequest(request);
  const endpointId = request.directive.endpoint?.endpointId || '';
  const roomName = getRoomNameFromEndpointId(endpointId);
  if (!roomName) {
    throw new Error('unable to map endpointId to room name');
  }

  let newBrightness: number;
  if (requestMethod === 'SetBrightness') {
    newBrightness = (request.directive.payload.brightness || 100) / 100;
  } else {
    const deltaBrightness =
      (request.directive.payload.brightnessDelta || 100) / 100;
    const roomState = (await getRoomState(
      roomName,
    )) as LightsService.API.IRegRoomState;
    newBrightness = roomState.brightness + deltaBrightness;
  }

  if (newBrightness > 1) {
    newBrightness = 1;
  } else if (newBrightness < 0) {
    newBrightness = 0;
  }

  await setRoomBrightness(roomName, newBrightness);

  const resp = generateBrightnessUpdateResp(
    newBrightness * 100,
    messageId,
    endpointId,
    requestToken,
  );

  context.succeed(resp);
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

export async function handler(
  request: Alexa.API.Request,
  context: Alexa.API.RequestContext,
): Promise<void> {
  if (!(await isVerifiedUser(getBearerTokenFromRequest(request)))) {
    const unauthResp = generateInvalidAuthCredResponse();
    console.log('DEBUG:', 'unauthorised response:', JSON.stringify(unauthResp));
    context.succeed(unauthResp);
  } else if (
    request.directive.header.namespace === 'Alexa.Discovery' &&
    request.directive.header.name === 'Discover'
  ) {
    console.log('DEBUG:', 'Discover request');
    handleDiscovery(request, context);
  } else if (request.directive.header.namespace === 'Alexa.PowerController') {
    if (
      request.directive.header.name === 'TurnOn' ||
      request.directive.header.name === 'TurnOff'
    ) {
      console.log('DEBUG:', 'TurnOn or TurnOff Request ');
      await handlePowerControl(request, context);
    }
  } else if (
    request.directive.header.namespace === 'Alexa.BrightnessController'
  ) {
    if (
      request.directive.header.name === 'SetBrightness' ||
      request.directive.header.name === 'AdjustBrightness'
    ) {
      console.log('DEBUG:', 'Brightness Request ');
      await handleBrightnessControl(request, context);
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
    console.log('DEBUG:', 'unhandled request ', JSON.stringify(request));
  }

  cleanseTokenFromRequest(request);
  console.log('DEBUG:', 'handled request ', JSON.stringify(request));
}
