export function handler(
  _event: unknown
): {statusCode: number; body: string;} {
  const response = {
    statusCode: 200,
    body: JSON.stringify('Hello from Lambda!'),
  };
  return response;
}
