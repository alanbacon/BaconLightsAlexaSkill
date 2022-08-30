// modified from
// https://github.com/sskorol/alexa-smart-home-skill-template/blob/master/typings/Alexa.d.ts
// sometimes the scope is under payload (for discovery requests) and sometimes it is under endpoint (for command requests)

declare namespace Alexa.API {
  export interface RequestContext {
    succeed: (resp: Response) => void;
  }

  export interface Request {
    directive: Directive;
  }

  export interface Directive {
    header: Header;
    payload: Payload;
    endpoint?: Endpoint;
  }

  export interface Payload {
    scope?: Scope;
    grant?: Grant;
    grantee?: Grantee;
    endpoints?: EndpointsItem[];
    type?: string;
    message?: string;
    estimatedDeferralInSeconds?: number;
    brightness?: number;
    brightnessDelta?: number;
  }

  export interface Grant {
    type: string;
    code: string;
  }

  export interface Grantee {
    type: string;
    token: string;
  }

  export interface Endpoint {
    scope?: Scope;
    endpointId: string;
    cookie?: Cookie;
  }

  export interface Scope {
    type: string;
    token: string;
  }

  export interface Response {
    context?: Context;
    event: Event;
  }

  export interface Context {
    properties: PropertiesItem[];
  }

  export interface Event {
    header: Header;
    endpoint?: Endpoint;
    payload: Payload;
  }

  export interface Header {
    namespace: string;
    name: string;
    payloadVersion: string;
    messageId: string;
    correlationToken?: string;
  }

  export interface PropertiesItem {
    namespace: string;
    name: string;
    value: Value | string | number | ChannelValue;
    timeOfSample: string;
    uncertaintyInMilliseconds: number;
  }

  export interface Value {
    value: string | number;
    scale?: string;
  }

  export interface ChannelValue {
    number: string;
    callSign: string;
    affiliateCallSign: string;
  }

  export interface BrightnessRequestPayload {
    brightnessDelta?: number;
    brightness?: number;
  }

  export interface SpeakerRequestPayload {
    volume?: number;
    volumeDefault?: number;
    mute?: boolean;
    volumeSteps?: number;
  }

  export interface ChannelRequestPayload {
    channel?: Channel;
    channelMetadata?: ChannelMetadata;
    channelCount?: number;
  }

  export interface InputRequestPayload {
    input: string;
  }

  export interface PercentageRequestPayload {
    percentageDelta?: number;
    percentage?: number;
  }

  export interface PowerLevelRequestPayload {
    powerLevelDelta?: number;
    powerLevel?: number;
  }

  export interface SceneStartedMessageRequestPayload {
    cause: Cause;
    timestamp: string;
  }

  export interface ThermostatRequestPayload {
    targetSetpoint?: Value;
    lowerSetpoint?: Value;
    upperSetpoint?: Value;
    targetSetpointDelta?: Value;
    thermostatMode?: Value;
  }

  export interface Cause {
    type: string;
  }

  export interface Channel {
    number: string;
    callSign: string;
    affiliateCallSign: string;
    uri: string;
  }

  export interface ChannelMetadata {
    name: string;
    image: string;
  }

  export interface EndpointsItem {
    endpointId: string;
    manufacturerName: string;
    friendlyName: string;
    description: string;
    additionalAttributes: AdditionalAttributes;
    displayCategories: string[];
    cookie: Cookie;
    capabilities: CapabilitiesItem[];
  }

  export type Cookie = Record<string, string>;

  export interface AdditionalAttributes {
    manufacturer: string;
    model: string;
    serialNumber: string;
    firmwareVersion: string;
    softwareVersion: string;
    customIdentifier: string;
  }

  export interface CapabilitiesItem {
    type: string;
    interface: string;
    version: string;
    properties?: Properties;
    configuration?: Configuration;
    supportsDeactivation?: boolean;
    cameraStreamConfigurations?: CameraStreamConfigurationsItem[];
  }

  export interface Configuration {
    supportedRange?: SupportedRange;
    presets?: Preset[];
  }

  export interface SupportedRange {
    minimumValue: number;
    maximumValue: number;
    precision: number;
  }

  export interface Preset {
    rangeValue: number;
    presetResources: {
      friendlyNames: PresetFriendlyName[];
    };
  }

  export interface PresetFriendlyName {
    '@type': string;
    value: {
      assetId?: string;
      text?: string;
      locale?: string;
    };
  }

  export interface Properties {
    supported: SupportedItem[];
    proactivelyReported?: boolean;
    retrievable?: boolean;
  }

  export interface SupportedItem {
    name: string;
  }

  export interface CameraStreamConfigurationsItem {
    protocols: string[];
    resolutions: ResolutionsItem[];
    authorizationTypes: string[];
    videoCodecs: string[];
    audioCodecs: string[];
  }

  export interface ResolutionsItem {
    width: number;
    height: number;
  }
}
