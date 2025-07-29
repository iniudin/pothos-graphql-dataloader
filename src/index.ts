import { createServer } from 'node:http'

import SchemaBuilder from '@pothos/core'
import DrizzlePlugin from '@pothos/plugin-drizzle'

import { eq } from 'drizzle-orm'
import { getTableConfig } from 'drizzle-orm/sqlite-core'
import { createYoga } from 'graphql-yoga'
import { db, relations } from './db'
import { posts, users } from './schema'

type DrizzleRelations = typeof relations

export interface PothosTypes {
  DrizzleRelations: DrizzleRelations
}

const builder = new SchemaBuilder<PothosTypes>({
  plugins: [DrizzlePlugin],
  drizzle: {
    client: db,
    relations,
    getTableConfig,
  },
})

const UserRef = builder.drizzleObject('users', {
  name: 'User',
  description: 'User object',
  fields: t => ({
    id: t.exposeID('id'),
    name: t.exposeString('name'),
    posts: t.relation('posts'),
  }),
})

const PostRef = builder.drizzleObject('posts', {
  name: 'Post',
  description: 'Post object',
  fields: t => ({
    id: t.exposeID('id'),
    title: t.exposeString('title'),
    content: t.exposeString('content'),
    author: t.relation('author'),
  }),
})

builder.queryType({
  fields: t => ({
    users: t.drizzleField({
      type: [UserRef],
      resolve: () => db.query.users.findMany(),
    }),
    posts: t.drizzleField({
      type: [PostRef],
      resolve: () => db.query.posts.findMany(),
    }),
    user: t.drizzleField({
      type: UserRef,
      args: {
        id: t.arg.int({ required: true }),
      },
      resolve: (query, _, args) =>
        db.query.users.findFirst(
          query({
            where: {
              id: args.id,
            },
          }),
        ),
    }),
    post: t.drizzleField({
      type: PostRef,
      args: {
        id: t.arg.int({ required: true }),
      },
      resolve: (query, _, args) =>
        db.query.posts.findFirst(
          query({
            where: {
              id: args.id,
            },
          }),
        ),
    }),
  }),
})

builder.mutationType({
  fields: t => ({
    createUser: t.drizzleField({
      type: UserRef,
      args: {
        name: t.arg.string({ required: true }),
      },
      resolve: async (query, _, args) => {
        const [user] = await db.insert(users).values({
          name: args.name,
        }).returning()
        return user
      },
    }),
    createPost: t.drizzleField({
      type: PostRef,
      args: {
        title: t.arg.string({ required: true }),
        content: t.arg.string({ required: true }),
        userId: t.arg.int({ required: true }),
      },
      resolve: async (query, _, args) => {
        const [post] = await db.insert(posts).values({
          title: args.title,
          content: args.content,
          userId: args.userId,
        }).returning()
        return post
      },
    }),
    updateUser: t.drizzleField({
      type: UserRef,
      args: {
        id: t.arg.int({ required: true }),
        name: t.arg.string(),
      },
      resolve: async (query, _, args) => {
        const [user] = await db.update(users).set({
          name: args.name ?? undefined,
        }).where(eq(users.id, args.id)).returning()
        return user
      },
    }),
    updatePost: t.drizzleField({
      type: PostRef,
      args: {
        id: t.arg.int({ required: true }),
        title: t.arg.string(),
        content: t.arg.string(),
        userId: t.arg.int(),
      },
      resolve: async (query, _, args) => {
        const [post] = await db.update(posts).set({
          title: args.title ?? undefined,
          content: args.content ?? undefined,
          userId: args.userId ?? undefined,
        }).where(eq(posts.id, args.id)).returning()
        return post
      },
    }),
  }),
})

const yoga = createYoga({
  schema: builder.toSchema(),
})

const server = createServer(yoga)

server.listen(3000, () => {
  console.warn('Visit http://localhost:3000/graphql')
})
