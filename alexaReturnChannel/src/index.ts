import { sendProactiveEvent } from './utils/sendProactiveEvent.js';
import { getAllReturnChannelTokens } from './utils/returnChannelTokenStore.js';

export async function handler(event: {
  power: 'ON' | 'OFF';
}): Promise<{ statusCode: number }> {
  try {
    const userTokens = await getAllReturnChannelTokens();

    for (const userToken of userTokens) {
      await sendProactiveEvent(event.power, userToken.token);
    }

    const response = {
      statusCode: 200,
    };
    return response;
  } catch (err) {
    return {
      statusCode: 500,
    };
  }
}
