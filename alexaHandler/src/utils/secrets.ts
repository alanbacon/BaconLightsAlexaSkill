import AWS from 'aws-sdk';
import { config } from './config.js';

const secretsClient = new AWS.SecretsManager({ region: config.awsRegion });

type SecretCert = {
  LIGHTS_SERVICE_PEM: string;
  LIGHTS_SERVICE_KEY: string;
};

type AlexaSecretCreds = {
  ALEXA_CLIENT_ID: string;
  ALEXA_CLIENT_SECRET: string;
};

export async function getLightServiceCert(): Promise<{
  cert: string;
  key: string;
}> {
  const secretCertRaw = await secretsClient
    .getSecretValue({ SecretId: config.secretCertName })
    .promise();

  if (!secretCertRaw?.SecretString) {
    throw new Error('unable to obtain light service cert');
  }

  const secretCert = JSON.parse(secretCertRaw!.SecretString) as SecretCert;

  const pemBuffer = Buffer.from(secretCert.LIGHTS_SERVICE_PEM, 'base64');
  const keyBuffer = Buffer.from(secretCert.LIGHTS_SERVICE_KEY, 'base64');

  return {
    cert: pemBuffer.toString(),
    key: keyBuffer.toString(),
  };
}

export async function getAlexaClientId(): Promise<{
  clientId: string;
  clientSecret: string;
}> {
  const secretCertRaw = await secretsClient
    .getSecretValue({ SecretId: config.secretAlexaClientCredsName })
    .promise();

  if (!secretCertRaw?.SecretString) {
    throw new Error('unable to obtain alexa client credentials');
  }

  const alexaSecretCreds = JSON.parse(
    secretCertRaw!.SecretString,
  ) as AlexaSecretCreds;

  return {
    clientId: alexaSecretCreds.ALEXA_CLIENT_ID,
    clientSecret: alexaSecretCreds.ALEXA_CLIENT_SECRET,
  };
}
