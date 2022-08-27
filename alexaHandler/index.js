import { handler as internalHandler } from './build/src/index.js';

export function handler(...args) {
  internalHandler(...args);
}
