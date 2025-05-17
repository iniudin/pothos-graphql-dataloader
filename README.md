# Graphql Dataloader Example

This is a simple example of using dataloader with `@pothos/plugin-dataloader`.

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

Visit http://localhost:3000/graphql

## Query

```graphql
query {
  users {
    id
    name
    posts {
      id
      title
      content
    }
  }
}
```

## Mutation

Create User mutation
```graphql
mutation {
  createUser(name: "John Doe") {
    id
    name
  }
}
```

Create Post mutation
```graphql
mutation {
  createPost(title: "Post 1", content: "Content 1", userId: 1) {
    id
    title
    content
    author {
      id
      name
    }
  }
}
```