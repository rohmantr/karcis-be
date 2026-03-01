import { PrimaryKey, Property, OptionalProps } from '@mikro-orm/core';
import { randomUUID } from 'crypto';

export abstract class BaseEntity {
  [OptionalProps]?: 'createdAt' | 'updatedAt' | 'id';

  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id: string = randomUUID();

  @Property()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
