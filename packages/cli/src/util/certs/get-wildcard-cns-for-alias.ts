import psl from 'psl';
import { InvalidDomain } from '../errors-ts.js';
import isWildcardAlias from '../alias/is-wildcard-alias.js';
import extractDomain from '../alias/extract-domain.js';

export default function getWildcardCNSForAlias(alias: string) {
  if (isWildcardAlias(alias)) {
    return [extractDomain(alias), alias];
  }

  const parsedDomain = psl.parse(alias);
  if (parsedDomain.error) {
    throw new InvalidDomain(alias);
  }

  const { domain, subdomain } = parsedDomain;
  if (!domain) {
    throw new InvalidDomain(alias);
  }

  const secondLevel =
    subdomain && subdomain.includes('.')
      ? subdomain.split('.').slice(1).join('.')
      : null;

  const root = secondLevel ? `${secondLevel}.${domain}` : domain;
  return [root, `*.${root}`];
}
