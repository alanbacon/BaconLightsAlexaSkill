interface IConfig {
  awsRegion: string;
  secretCertName: string;
  lightsServiceApiUrl: string;
}

export const config: IConfig = {
  awsRegion: 'eu-west-1',
  secretCertName: 'bacon-lights-service-cert',
  lightsServiceApiUrl: 'https://lights.knotanti.uk/api/',
};
