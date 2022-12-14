import {
  switchPowerOff,
  switchPowerOn,
  setRoomBrightness,
  setRoomBrightnessMode,
  setRoomFadeMode,
  setNextRoomBrightnessMode,
  setRoomGroupBrightnessLevel,
  setNextRoomGroupBrightnessLevel,
  getRoomBrightnessMode,
  getRoomState,
  getRoomGroupState,
  getRoomNameFromEndpointId,
} from './utils/lightsService.js';
import {
  generateAcceptGrantResponse,
  generateInvalidAuthCredResponse,
  generateDiscoveryResponse,
  generatePowerUpdateResp,
  generateBrightnessUpdateResp,
  generateModeUpdateResp,
  generateStateReportResponse,
} from './utils/alexaResponses.js';
import {
  isVerifiedUser,
  generateReturnChannelAccessToken,
} from './utils/amazonProfile.js';
import {
  IBrightnessMode,
  ModeInstanceNames,
  deviceDefinitions,
  IBrightnessLevel,
} from './utils/config.js';

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
  const { name, type } = getRoomNameFromEndpointId(endpointId);
  if (!name) {
    throw new Error('unable to map endpointId to room name');
  }
  let powerResult: 'ON' | 'OFF';

  if (requestMethod === 'TurnOn') {
    // Make the call to your device cloud for control
    // powerResult = stubControlFunctionToYourCloud(endpointId, token, request);
    await switchPowerOn(name, type === 'group');
    powerResult = 'ON';
  } else {
    // Make the call to your device cloud for control and check for success
    // powerResult = stubControlFunctionToYourCloud(endpointId, token, request);
    await switchPowerOff(name, type === 'group');
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
  const { name: roomName } = getRoomNameFromEndpointId(endpointId);
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

async function handleBrightnessMode(
  request: Alexa.API.Request,
  context: Alexa.API.RequestContext,
): Promise<void> {
  const messageId = request.directive.header.messageId;
  const requestMethod = request.directive.header.name;
  const requestToken = getBearerTokenFromRequest(request);
  const endpointId = request.directive.endpoint?.endpointId || '';
  const { name: roomName } = getRoomNameFromEndpointId(endpointId);
  if (!roomName) {
    throw new Error('unable to map endpointId to room name');
  }

  let newModeName: string;
  if (requestMethod === 'SetMode') {
    const modeName = request.directive.payload.mode || '';
    await setRoomBrightnessMode(roomName, modeName);
    newModeName = modeName;
  } else {
    const delta = request.directive.payload.modeDelta || 0;
    newModeName = await setNextRoomBrightnessMode(roomName, delta);
  }

  const resp = generateModeUpdateResp(
    newModeName,
    ModeInstanceNames.BrightnessMode,
    messageId,
    endpointId,
    requestToken,
  );
  context.succeed(resp);
}

async function handleBrightnessLevel(
  request: Alexa.API.Request,
  context: Alexa.API.RequestContext,
): Promise<void> {
  const messageId = request.directive.header.messageId;
  const requestMethod = request.directive.header.name;
  const requestToken = getBearerTokenFromRequest(request);
  const endpointId = request.directive.endpoint?.endpointId || '';
  const { name: roomGroupName } = getRoomNameFromEndpointId(endpointId);
  if (!roomGroupName) {
    throw new Error('unable to map endpointId to room group name');
  }

  let newLevelName: string;
  if (requestMethod === 'SetMode') {
    const modeName = request.directive.payload.mode || '';
    await setRoomGroupBrightnessLevel(roomGroupName, modeName);
    newLevelName = modeName;
  } else {
    const delta = request.directive.payload.modeDelta || 0;
    newLevelName = await setNextRoomGroupBrightnessLevel(roomGroupName, delta);
  }

  const resp = generateModeUpdateResp(
    newLevelName,
    ModeInstanceNames.BrightnessLevel,
    messageId,
    endpointId,
    requestToken,
  );
  context.succeed(resp);
}

async function handleFadeMode(
  request: Alexa.API.Request,
  context: Alexa.API.RequestContext,
): Promise<void> {
  const messageId = request.directive.header.messageId;
  const requestToken = getBearerTokenFromRequest(request);
  const endpointId = request.directive.endpoint?.endpointId || '';
  const { name: roomName } = getRoomNameFromEndpointId(endpointId);
  if (!roomName) {
    throw new Error('unable to map endpointId to room name');
  }

  const modeName = request.directive.payload.mode || '';
  await setRoomFadeMode(roomName, modeName);
  const resp = generateModeUpdateResp(
    modeName,
    ModeInstanceNames.FadeMode,
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
  const { name, type } = getRoomNameFromEndpointId(endpointId);
  if (!name) {
    throw new Error('unable to map endpointId to room[Group] name');
  }

  let isOn: boolean;
  let brightnessMode: IBrightnessMode | undefined = undefined;
  let brightness: number | undefined;
  let brightnessLevel: IBrightnessLevel | undefined = undefined;
  let fadeActive: boolean | undefined = undefined;
  if (type === 'room') {
    const roomState = await getRoomState(name);
    isOn = roomState.on;
    if (roomState._name === 'kitchen') {
      const { brightnessModes, brightnessModeIndex } =
        await getRoomBrightnessMode(name);
      brightnessMode = brightnessModes[brightnessModeIndex];
    } else {
      brightness = (roomState as LightsService.API.IRegRoomState).brightness;
      fadeActive = (roomState as LightsService.API.IRegRoomState)
        ._autoBrightnessActive;
    }
  } else {
    const roomGroupState = await getRoomGroupState(name);
    isOn = roomGroupState.on;
    const deviceDef = deviceDefinitions.filter(
      (dd) => dd.roomGroupName === name,
    )[0];
    if (!deviceDef) {
      throw new Error(
        `unable to find device definition for roomGroupName: ${name}`,
      );
    }
    const brightnessLevels = deviceDef.brightnessLevels;
    if (!brightnessLevels) {
      throw new Error(
        `device definition ${deviceDef.roomGroupName} does not have brightness levels`,
      );
    }
    brightnessLevel = brightnessLevels[roomGroupState.brightnessLevelMin];
  }

  const response = generateStateReportResponse(
    endpointId,
    correlationToken,
    isOn,
    brightness,
    brightnessMode,
    brightnessLevel,
    fadeActive,
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
  } else if (request.directive.header.namespace === 'Alexa.ModeController') {
    if (
      request.directive.header.instance === ModeInstanceNames.BrightnessMode
    ) {
      console.log('DEBUG:', 'Brightness Mode Request ');
      await handleBrightnessMode(request, context);
    } else if (
      request.directive.header.instance === ModeInstanceNames.FadeMode
    ) {
      console.log('DEBUG:', 'Fade Mode Request ');
      await handleFadeMode(request, context);
    } else if (
      request.directive.header.instance === ModeInstanceNames.BrightnessLevel
    ) {
      console.log('DEBUG:', 'Brightness Level Request ');
      await handleBrightnessLevel(request, context);
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
