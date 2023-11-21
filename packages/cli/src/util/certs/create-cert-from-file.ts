import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import Client from '../client.js';
import type { Cert } from '@vercel-internals/types';
import { isErrnoException } from '@vercel/error-utils';
import { isAPIError } from '../errors-ts.js';

export default async function createCertFromFile(
  client: Client,
  keyPath: string,
  certPath: string,
  caPath: string
) {
  client.output.spinner('Adding your custom certificate');

  try {
    const cert = readFileSync(resolve(certPath), 'utf8');
    const key = readFileSync(resolve(keyPath), 'utf8');
    const ca = readFileSync(resolve(caPath), 'utf8');

    const certificate = await client.fetch<Cert>('/v3/now/certs', {
      method: 'PUT',
      body: {
        ca,
        cert,
        key,
      },
    });
    return certificate;
  } catch (err: unknown) {
    if (isErrnoException(err) && err.code === 'ENOENT') {
      return new Error(`The specified file "${err.path}" doesn't exist.`);
    }

    if (isAPIError(err) && err.status < 500) {
      return err;
    }

    throw err;
  }
}
