interface IConfig {
  awsRegion: string;
  returnChannelTokenTableName: string;
  proactiveEventEndpoint: string;
}

export const config: IConfig = {
  awsRegion: 'eu-west-1',
  returnChannelTokenTableName: 'alexa-bacon-lights-access-tokens',
  proactiveEventEndpoint: 'https://api.eu.amazonalexa.com/v3/events',
};
