import {
  bigint,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export const saveModeEnum = pgEnum('save_mode', ['CAREER', 'CLUB']);
export const allowlistStatusEnum = pgEnum('allowlist_status', ['ACTIVE', 'REVOKED']);

export const profiles = pgTable('profiles', {
  id: text('id').primaryKey(),
  displayName: text('display_name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const authAllowedSubjects = pgTable('auth_allowed_subjects', {
  subject: text('subject').primaryKey(),
  status: allowlistStatusEnum('status').notNull().default('ACTIVE'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const gameSaves = pgTable(
  'game_saves',
  {
    id: text('id').primaryKey(),
    ownerId: text('owner_id')
      .notNull()
      .references(() => profiles.id),
    mode: saveModeEnum('mode').notNull(),
    revision: bigint('revision', { mode: 'bigint' }).notNull().default(0n),
    versions: integer('versions').notNull().default(1),
    phase: text('phase').notNull().default('BOOT'),
    summary: jsonb('summary').notNull().default({}),
    state: jsonb('state').notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  table => [index('game_saves_owner_updated_idx').on(table.ownerId, table.updatedAt)],
);

export const commandReceipts = pgTable(
  'command_receipts',
  {
    saveId: text('save_id')
      .notNull()
      .references(() => gameSaves.id, { onDelete: 'cascade' }),
    commandId: text('command_id').notNull(),
    requestHash: text('request_hash').notNull(),
    result: jsonb('result').notNull(),
    resultingRevision: bigint('resulting_revision', { mode: 'bigint' }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  table => [primaryKey({ columns: [table.saveId, table.commandId] })],
);