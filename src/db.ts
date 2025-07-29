import process from 'node:process'
import { defineRelations } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from './schema'

export const relations = defineRelations(schema, r => ({
  posts: {
    author: r.one.users({
      from: [r.posts.userId],
      to: [r.users.id],
    }),
  },
  users: {
    posts: r.many.posts(),
  },
}))

export const db = drizzle(process.env.DB_FILE_NAME!, { schema, relations })
