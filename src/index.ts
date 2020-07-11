import {
  ApolloServerPlugin,
  GraphQLRequestListener,
  GraphQLRequestListenerParsingDidEnd,
  GraphQLRequestListenerValidationDidEnd,
  GraphQLRequestContextDidResolveOperation,
  GraphQLRequestListenerExecutionDidEnd,
  BaseContext,
  ValueOrPromise,
} from 'apollo-server-plugin-base';

export interface Result {
  operationName?: string;
  operationDuration: number;
  parsingDuration: number;
  validationDuration: number;
  executionDuration: number;
}

export interface Options {
  callback: (result: Result) => void;
}

export default (options: Options = Object.create(null)): ApolloServerPlugin => ({
  requestDidStart(): GraphQLRequestListener {
    const operationStartTimestamp = process.hrtime.bigint();

    let operationName: string | undefined;

    let parsingDuration: number;
    let validationDuration: number;
    let executionDuration: number;

    let operationDuration: number;

    let didEncounterErrors: boolean;

    return {
      parsingDidStart(): GraphQLRequestListenerParsingDidEnd {
        const startTimestamp = process.hrtime.bigint();

        return (err) => {
          if (!err) {
            parsingDuration = Number(process.hrtime.bigint() - startTimestamp) / 1e6;
          }
        };
      },
      validationDidStart(): GraphQLRequestListenerValidationDidEnd {
        const startTimestamp = process.hrtime.bigint();

        return (errs) => {
          if (!errs) {
            validationDuration = Number(process.hrtime.bigint() - startTimestamp) / 1e6;
          }
        };
      },
      didResolveOperation(requestContext: GraphQLRequestContextDidResolveOperation<BaseContext>): ValueOrPromise<void> {
        operationName = requestContext.operationName || undefined;

        return;
      },
      executionDidStart(): GraphQLRequestListenerExecutionDidEnd {
        const startTimestamp = process.hrtime.bigint();

        return (err) => {
          if (!err) {
            executionDuration = Number(process.hrtime.bigint() - startTimestamp) / 1e6;
          }
        };
      },
      didEncounterErrors(): ValueOrPromise<void> {
        didEncounterErrors = true;
      },
      willSendResponse(): ValueOrPromise<void> {
        const { callback } = options;

        if (!didEncounterErrors) {
          operationDuration = Number(process.hrtime.bigint() - operationStartTimestamp) / 1e6;

          callback({ operationName, operationDuration, parsingDuration, validationDuration, executionDuration });
        }
      }
    };
  },
});