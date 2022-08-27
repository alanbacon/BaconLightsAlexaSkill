interface IConfig {
  awsRegion: string;
  secretCertName: string;
  secretAlexaClientCredsName: string;
  lightsServiceApiUrl: string;
  awsLwaEndpoint: string;
  returnChannelTokenTableName: string;
}

export const config: IConfig = {
  awsRegion: 'eu-west-1',
  secretCertName: 'bacon-lights-service-cert',
  secretAlexaClientCredsName: 'alexa-bacon-lights-client-credentials',
  lightsServiceApiUrl: 'https://lights.knotanti.uk/api/',
  awsLwaEndpoint: 'https://api.amazon.com/auth/o2/token',
  returnChannelTokenTableName: 'alexa-bacon-lights-access-tokens',
};
