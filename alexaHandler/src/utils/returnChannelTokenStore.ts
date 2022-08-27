import AWS from 'aws-sdk';
import { config } from './config.js';

const ddb = new AWS.DynamoDB({ region: config.awsRegion });

export async function writeReturnChannelTokens(
  email: string,
  token: string,
  refreshToken: string,
): Promise<void> {
  await ddb
    .putItem({
      TableName: config.returnChannelTokenTableName,
      Item: {
        email: { S: email },
        token: { S: token },
        refreshToken: { S: refreshToken },
      },
    })
    .promise();
}
