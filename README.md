# apollo-server-plugin-operation-duration [![Build Status](https://travis-ci.org/zulhilmizainuddin/apollo-server-plugin-operation-duration.svg?branch=master)](https://travis-ci.org/zulhilmizainuddin/apollo-server-plugin-operation-duration)

This Apollo server plugin exposes an interface for instrumentation of query operation duration.

The following information are exposed for instrumentation:
- operationName
- operationDuration
- parsingDuration
- validationDuration
- executionDuration

Refer to [Apollo server request lifecycle event flow](https://www.apollographql.com/docs/apollo-server/integrations/plugins/#request-lifecycle-event-flow).

Callback for instrumentation will only be executed for successful operations.

## Usage

This is an example when instrumenting with Prometheus.

```typescript
import ApolloServerOperationDuration from 'apollo-server-plugin-operation-duration';

import { ApolloServer, gql } from 'apollo-server';
import { Histogram, exponentialBuckets } from 'prom-client';

const operationDurationHistogram = new Histogram({
  name: 'operation_duration_histogram',
  help: 'GraphQL query operation duration histogram',
  labelNames: ['name'],
  buckets: exponentialBuckets(100, 2, 8),
});

const server = new ApolloServer({
  typeDefs: gql`
    type Book {
      title: String
      author: String
    }

    type Query {
      books: [Book]
    }
  `,
  mocks: true,
  mockEntireSchema: true,
  plugins: [ApolloServerOperationDuration({
    callback: ({ operationName, operationDuration, parsingDuration, validationDuration, executionDuration }) => {
      operationDurationHistogram.labels(operationName).observe(operationDuration);
    },
  })],
});

server.listen().then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`);
});
```
