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

  return {
    cert: secretCert.LIGHTS_SERVICE_PEM,
    key: secretCert.LIGHTS_SERVICE_KEY,
  };
}
