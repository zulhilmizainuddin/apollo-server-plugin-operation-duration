import 'cross-fetch/polyfill';

import ApolloClient from 'apollo-boost';

import { expect } from 'chai';
import { ApolloServer, gql } from 'apollo-server';

import ApolloServerOperationDuration, { Result } from '../src/index';

describe('ApolloServerOperationDuration', () => {
  let server: ApolloServer;

  let client: any;

  const init = async (callback: (result: Result) => void) => {
    server = new ApolloServer({
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
        callback,
      })],
    });

    const { url } = await server.listen();

    client = new ApolloClient({ uri: url });
  };

  afterEach(async () => {
    await server.stop();
  });

  it('should retrieve durations with operation name', async () => {
    await init(({ operationName, operationDuration, parsingDuration, validationDuration, executionDuration }) => {
      expect(operationName).to.equal('booksOperation');
      expect(operationDuration).to.be.above(0);
      expect(parsingDuration).to.be.above(0);
      expect(validationDuration).to.be.above(0);
      expect(executionDuration).to.be.above(0);
    });

    const query = gql`
      query booksOperation {
        books {
          title
          author
        }
      }
    `;

    const { data, errors } = await client.query({ query, errorPolicy: 'all' });

    expect(data).to.not.be.undefined;
    expect(errors).to.be.undefined;
  });

  it('should retrieve durations without operation name', async () => {
    await init(({ operationName, operationDuration, parsingDuration, validationDuration, executionDuration }) => {
      expect(operationName).to.be.null;
      expect(operationDuration).to.be.above(0);
      expect(parsingDuration).to.be.above(0);
      expect(validationDuration).to.be.above(0);
      expect(executionDuration).to.be.above(0);
    });

    const query = gql`
      query {
        books {
          title
          author
        }
      }
    `;

    const { data, errors } = await client.query({ query, errorPolicy: 'all' });

    expect(data).to.not.be.undefined;
    expect(errors).to.be.undefined;
  });
});