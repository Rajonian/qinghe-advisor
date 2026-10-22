import {sqliteTable,text,integer} from 'drizzle-orm/sqlite-core';
export const aiSettings=sqliteTable('ai_settings',{userId:text('user_id').primaryKey(),encryptedKey:text('encrypted_key').notNull(),model:text('model').notNull(),enabled:integer('enabled').notNull().default(0),updatedAt:text('updated_at').notNull()});
export const requestLimits=sqliteTable('request_limits',{bucket:text('bucket').primaryKey(),count:integer('count').notNull(),expiresAt:integer('expires_at').notNull()});
export const aiAudit=sqliteTable('ai_audit',{id:text('id').primaryKey(),userId:text('user_id').notNull(),action:text('action').notNull(),status:text('status').notNull(),model:text('model'),tokens:integer('tokens').notNull().default(0),createdAt:text('created_at').notNull()});
