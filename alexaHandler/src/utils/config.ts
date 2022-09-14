interface IConfig {
  awsRegion: string;
  secretCertName: string;
  secretAlexaClientCredsName: string;
  lightsServiceApiUrl: string;
  awsLwaEndpoint: string;
  amazonProfileEndpoint: string;
  returnChannelTokenTableName: string;
  allowedUserEmails: string[];
}

export interface IBrightnessMode {
  modeName: string;
  presetNames: string[];
  brightnessValue: number;
}

export interface IBrightnessLevel {
  levelName: string;
  presetNames: string[];
  level: number;
}

export interface IDeviceDefinition {
  friendlyName: string;
  endpointId: string;
  roomName?: string;
  roomGroupName?: string;
  brightnessRangeControl: boolean;
  brightnessModes?: IBrightnessMode[];
  brightnessLevels?: IBrightnessLevel[];
}

export const config: IConfig = {
  awsRegion: 'eu-west-1',
  secretCertName: 'bacon-lights-service-cert',
  secretAlexaClientCredsName: 'alexa-bacon-lights-client-credentials',
  lightsServiceApiUrl: 'https://lights.knotanti.uk/api/',
  awsLwaEndpoint: 'https://api.amazon.com/auth/o2/token',
  amazonProfileEndpoint: 'https://api.amazon.com/user/profile',
  returnChannelTokenTableName: 'alexa-bacon-lights-access-tokens',
  allowedUserEmails: ['the_resonance@hotmail.com'],
};

export const ModeInstanceNames = {
  BrightnessMode: 'BrightnessMode',
  FadeMode: 'FadeMode',
  BrightnessLevel: 'BrightnessLevel',
};

export const deviceDefinitions: IDeviceDefinition[] = [
  {
    friendlyName: 'Study Lights',
    endpointId: 'studyLights',
    roomName: 'study',
    brightnessRangeControl: true,
  },
  {
    friendlyName: 'Bedroom Lights',
    endpointId: 'bedroomLights',
    roomName: 'bedroom',
    brightnessRangeControl: true,
  },
  {
    friendlyName: 'Living Room Lights',
    endpointId: 'livingRoomLights',
    roomName: 'lounge',
    brightnessRangeControl: true,
  },
  {
    friendlyName: 'Dinning Room Lights',
    endpointId: 'dinningRoomLights',
    roomName: 'dinning',
    brightnessRangeControl: true,
  },
  {
    friendlyName: 'Kitchen Lights',
    endpointId: 'kitchenLights',
    roomName: 'kitchen',
    brightnessRangeControl: false,
    brightnessModes: [
      {
        modeName: 'dim',
        presetNames: ['dim', 'dimmest', 'low', 'lowest', 'ambient'],
        brightnessValue: 0.1,
      },
      {
        modeName: 'medium',
        presetNames: ['medium', 'half-brightness', 'soft', 'fifty percent'],
        brightnessValue: 0.501,
      },
      {
        modeName: 'bright',
        presetNames: ['full brightness', 'full', 'one hundred percent'],
        brightnessValue: 1,
      },
    ],
  },
  {
    friendlyName: 'Downstairs Lights',
    endpointId: 'downstairsLights',
    roomGroupName: 'downstairs',
    brightnessRangeControl: false,
    brightnessLevels: [
      {
        levelName: 'veryDim',
        presetNames: ['very dim', 'dimmest', 'lowest', 'level one'],
        level: 0,
      },
      {
        levelName: 'dim',
        presetNames: ['dim', 'low', 'ambient', 'level two'],
        level: 1,
      },
      {
        levelName: 'medium',
        presetNames: [
          'medium',
          'half-brightness',
          'soft',
          'fifty percent',
          'level three',
        ],
        level: 2,
      },
      {
        levelName: 'bright',
        presetNames: ['almost full brightness', 'almost full', 'level four'],
        level: 3,
      },
      {
        levelName: 'veryBright',
        presetNames: [
          'full brightness',
          'full',
          'one hundred percent',
          'level five',
        ],
        level: 4,
      },
    ],
  },
];
