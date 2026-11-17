import { randomUUID } from "node:crypto";

declare const domainIdentityBrand: unique symbol;

export type DomainIdentity<Name extends string> = string & {
  readonly [domainIdentityBrand]: Name;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface DomainIdentityType<Name extends string> {
  create(): DomainIdentity<Name>;
  from(value: string): DomainIdentity<Name>;
  fromLegacy(value: string): DomainIdentity<Name>;
  is(value: string): value is DomainIdentity<Name>;
}

export function defineDomainIdentity<Name extends string>(
  name: Name,
): DomainIdentityType<Name> {
  return {
    create: () => randomUUID() as DomainIdentity<Name>,
    from: (value: string) => {
      if (!UUID_PATTERN.test(value)) {
        throw new Error(`${name} must be a valid UUID`);
      }
      return value as DomainIdentity<Name>;
    },
    fromLegacy: (value: string) => value as DomainIdentity<Name>,
    is: (value: string): value is DomainIdentity<Name> =>
      UUID_PATTERN.test(value),
  };
}
