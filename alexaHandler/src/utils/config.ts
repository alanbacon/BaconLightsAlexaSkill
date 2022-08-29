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

export interface IDeviceDefinition {
  friendlyName: string;
  endpointId: string;
  roomName: string;
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

export const deviceDefinitions: IDeviceDefinition[] = [
  {
    friendlyName: 'Study Lights',
    endpointId: 'studyLights',
    roomName: 'study',
  },
  {
    friendlyName: 'Bedroom Lights',
    endpointId: 'bedroomLights',
    roomName: 'bedroom',
  },
  {
    friendlyName: 'Living Room Lights',
    endpointId: 'livingRoomLights',
    roomName: 'lounge',
  },
  {
    friendlyName: 'Dinning Room Lights',
    endpointId: 'dinningRoomLights',
    roomName: 'dinning',
  },
  {
    friendlyName: 'Kitchen Lights',
    endpointId: 'kitchenLights',
    roomName: 'kitchen',
  },
];
