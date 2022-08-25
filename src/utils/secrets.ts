import AWS from 'aws-sdk';
import { config } from './config.js';

const secretsClient = new AWS.SecretsManager({ region: config.awsRegion });

type SecretCert = {
  LIGHTS_SERVICE_PEM: string;
  LIGHTS_SERVICE_KEY: string;
};

export async function getLightServiceCert(): Promise<{
  cert: string;
  key: string;
}> {
  const secretCertRaw = await secretsClient
    .getSecretValue({ SecretId: config.secretCertName })
    .promise();

  const secretCert = JSON.parse(secretCertRaw.SecretString) as SecretCert;

  const pemBuffer = Buffer.from(secretCert.LIGHTS_SERVICE_PEM, 'base64');
  const keyBuffer = Buffer.from(secretCert.LIGHTS_SERVICE_KEY, 'base64');

  return {
    cert: pemBuffer.toString(),
    key: keyBuffer.toString(),
  };
}
