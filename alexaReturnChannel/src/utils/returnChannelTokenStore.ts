import AWS from 'aws-sdk';
import { config } from './config.js';

const ddb = new AWS.DynamoDB({ region: config.awsRegion });

type DbEntry = {
  email: { S: string };
  token: { S: string };
  refreshToken: { S: string };
};

export async function writeReturnChannelTokens(
  email: string,
  token: string,
  refreshToken: string,
): Promise<void> {
  const item: DbEntry = {
    email: { S: email },
    token: { S: token },
    refreshToken: { S: refreshToken },
  };

  await ddb
    .putItem({
      TableName: config.returnChannelTokenTableName,
      Item: item,
    })
    .promise();
}

export async function getAllReturnChannelTokens(): Promise<
  { email: string; token: string; refreshToken: string }[]
> {
  const rows = await ddb
    .scan({
      TableName: config.returnChannelTokenTableName,
    })
    .promise();

  if (!rows || !rows.Items) {
    throw new Error('could not scan return channel token table');
  } else {
    rows.Items as DbEntry[];
  }

  return rows.Items.map((item) => {
    return {
      email: item.email.S || '',
      token: item.token.S || '',
      refreshToken: item.refreshToken.S || '',
    };
  });
}
