import process from 'node:process'
import { defineRelations } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/libsql'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import 'dotenv/config'

export const users = sqliteTable('users', {
  id: integer().primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
})

export const posts = sqliteTable('posts', {
  id: integer().primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  content: text('content').notNull(),
  userId: integer('user_id').notNull().references(() => users.id),
})

export type IUser = typeof users.$inferSelect
export type IPost = typeof posts.$inferSelect

export const schema = {
  users,
  posts,
}

export const relations = defineRelations(schema, r => ({
  posts: {
    user: r.one.users({
      from: [r.posts.userId],
      to: [r.users.id],
    }),
  },
  user: r.many.posts({
    from: [r.users.id],
    to: [r.posts.id],
  }),
}))

export const db = drizzle(process.env.DB_FILE_NAME!, { schema, relations })
