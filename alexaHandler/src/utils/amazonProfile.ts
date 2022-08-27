import fetch from 'node-fetch';

interface AmazonUserProfile {
  user_ID: string;
  name: string;
  email: string;
}

export async function getAmazonUserProfile(
  bearerToken: string,
): Promise<AmazonUserProfile> {
  const amazonProfileEndpoint = 'https://api.amazon.com/user/profile';
  const resp = await fetch(amazonProfileEndpoint, {
    headers: {
      Authorization: `Bearer ${bearerToken}`,
    },
  });
  return (await resp.json()) as AmazonUserProfile;
}
