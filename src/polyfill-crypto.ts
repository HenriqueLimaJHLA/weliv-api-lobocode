/**
 * @nestjs/schedule usa crypto.global (ex.: randomUUID) como no browser.
 * Node 18 não define globalThis.crypto por padrão; Node 19+ sim.
 */
import { webcrypto } from 'node:crypto';

if (typeof globalThis.crypto === 'undefined') {
  Object.defineProperty(globalThis, 'crypto', {
    value: webcrypto,
    enumerable: true,
    configurable: true,
    writable: false,
  });
}
