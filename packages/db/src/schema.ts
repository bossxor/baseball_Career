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
  uniqueIndex,
} from 'drizzle-orm/pg-core';

export const saveModeEnum = pgEnum('save_mode', ['CAREER', 'CLUB']);
export const allowlistStatusEnum = pgEnum('allowlist_status', ['ACTIVE', 'REVOKED']);
export const privateFileKindEnum = pgEnum('private_file_kind', ['BACKUP', 'CHRONICLE_JSON', 'CARD_PNG']);
export const privateFileStatusEnum = pgEnum('private_file_status', ['READY', 'FAILED', 'EXPIRED']);

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

/** Owner-private export objects (backup / chronicle / card). Body is UTF-8 text for M7 JSON backups. */
export const privateFiles = pgTable(
  'private_files',
  {
    id: text('id').primaryKey(),
    ownerId: text('owner_id')
      .notNull()
      .references(() => profiles.id),
    saveId: text('save_id').references(() => gameSaves.id, { onDelete: 'set null' }),
    kind: privateFileKindEnum('kind').notNull(),
    status: privateFileStatusEnum('status').notNull().default('READY'),
    mime: text('mime').notNull(),
    byteSize: integer('byte_size').notNull(),
    contentHash: text('content_hash').notNull(),
    body: text('body').notNull(),
    fileName: text('file_name').notNull(),
    requestId: text('request_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
  },
  table => [
    uniqueIndex('private_files_owner_request_uidx').on(table.ownerId, table.requestId),
    index('private_files_owner_created_idx').on(table.ownerId, table.createdAt),
    index('private_files_save_idx').on(table.saveId, table.createdAt),
  ],
);