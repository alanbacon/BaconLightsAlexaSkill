import fetch from 'node-fetch';
import { config } from './config.js';
import { writeReturnChannelTokens } from './returnChannelTokenStore.js';
import { getAlexaClientId } from './secrets.js';

interface AmazonUserProfile {
  user_ID: string;
  name: string;
  email: string;
}

export async function getAmazonUserProfile(
  bearerToken: string,
): Promise<AmazonUserProfile> {
  const resp = await fetch(config.amazonProfileEndpoint, {
    headers: {
      Authorization: `Bearer ${bearerToken}`,
    },
  });
  return (await resp.json()) as AmazonUserProfile;
}

async function getUsersEmailAddress(bearerToken: string): Promise<string> {
  const userProfile = await getAmazonUserProfile(bearerToken);
  return userProfile.email;
}

export async function isVerifiedUser(bearerToken: string): Promise<boolean> {
  const userEmail = await getUsersEmailAddress(bearerToken);

  if (!userEmail) {
    return false;
  }

  const verfiedUserEmailAddresses = new Set(config.allowedUserEmails);
  return verfiedUserEmailAddresses.has(userEmail);
}

type TokenResp = {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
};

async function requestLWAToken(
  code: string,
  clientId: string,
  clientSecret: string,
): Promise<TokenResp> {
  const resp = await fetch(config.awsLwaEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!resp.ok) {
    throw new Error('failed to request LWA token');
  }

  return (await resp.json()) as TokenResp;
}

export async function generateReturnChannelAccessToken(
  bearerToken: string,
  requestCode: string,
): Promise<void> {
  const alexaClientId = await getAlexaClientId();
  const userEmail = await getUsersEmailAddress(bearerToken);
  const tokenResp = await requestLWAToken(
    requestCode,
    alexaClientId.clientId,
    alexaClientId.clientSecret,
  );
  await writeReturnChannelTokens(
    userEmail,
    tokenResp.access_token,
    tokenResp.refresh_token,
  );
}
