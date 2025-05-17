import 'dotenv/config';
import { drizzle } from 'drizzle-orm/libsql';
import { integer, text, sqliteTable } from 'drizzle-orm/sqlite-core';


export const db = drizzle(process.env.DB_FILE_NAME!);

export const users = sqliteTable('users', {
  id: integer().primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
});

export const posts = sqliteTable('posts', {
  id: integer().primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  content: text('content').notNull(),
  userId: integer('user_id').notNull().references(() => users.id),
});


export type IUser = typeof users.$inferSelect;
export type IPost = typeof posts.$inferSelect;

export const tables = {
  users,
  posts,
};
