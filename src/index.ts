import type { IPost, IUser } from './db'
import { createServer } from 'node:http'

import SchemaBuilder from '@pothos/core'
import DataloaderPlugin from '@pothos/plugin-dataloader'
import { eq, inArray } from 'drizzle-orm'

import { createYoga } from 'graphql-yoga'
import { db, schema } from './db'

const builder = new SchemaBuilder<{
  Objects: {
    User: IUser
    Post: IPost
  }
}>({
  plugins: [DataloaderPlugin],
})

builder.objectType('User', {
  fields: t => ({
    id: t.exposeID('id'),
    name: t.exposeString('name'),
    posts: t.loadableGroup({
      type: 'Post',
      load: async (ids: number[]) => {
        const posts = await db.select().from(schema.posts).where(inArray(schema.posts.userId, ids))
        return posts
      },
      args: {
        ids: t.arg.idList(),
      },
      group: post => post.userId,
      resolve: user => user.id,
    }),
  }),
})

builder.objectType('Post', {
  fields: t => ({
    id: t.exposeID('id'),
    title: t.exposeString('title'),
    content: t.exposeString('content'),
    author: t.loadable({
      type: 'User',
      load: async (ids: number[]) => {
        const users = await db.select().from(schema.users).where(inArray(schema.users.id, ids))
        const usersMap = new Map(users.map(user => [user.id, user]))
        return ids.map(id => usersMap.get(id))
      },
      args: {
        ids: t.arg.idList(),
      },
      resolve: post => post.userId,
    }),
  }),
})

builder.queryType({
  fields: t => ({
    users: t.field({
      type: ['User'],
      resolve: async () => await db.select().from(schema.users),
    }),
    posts: t.field({
      type: ['Post'],
      resolve: async () => await db.select().from(schema.posts),
    }),

    user: t.field({
      type: 'User',
      args: {
        id: t.arg.int({ required: true }),
      },
      resolve: async (_, args) => {
        const [user] = await db.select().from(schema.users).where(eq(schema.users.id, args.id))
        return user
      },
    }),

    post: t.field({
      type: 'Post',
      args: {
        id: t.arg.int({ required: true }),
      },
      resolve: async (_, args) => {
        const [post] = await db.select().from(schema.posts).where(eq(schema.posts.id, args.id))
        return post
      },
    }),
  }),
})

builder.mutationType({
  fields: t => ({
    createUser: t.field({
      type: 'User',
      args: {
        name: t.arg.string({ required: true }),
      },
      resolve: async (_, args) => {
        const [user] = await db.insert(schema.users).values({ name: args.name }).returning()
        return user
      },
    }),
    createPost: t.field({
      type: 'Post',
      args: {
        title: t.arg.string({ required: true }),
        content: t.arg.string({ required: true }),
        userId: t.arg.int({ required: true }),
      },
      resolve: async (_, args) => {
        const [post] = await db.insert(schema.posts).values({ title: args.title, content: args.content, userId: args.userId }).returning()
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
