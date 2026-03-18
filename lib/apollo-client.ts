import { env } from "@/config/env";
import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";

export const apolloClient = (token: string) => {
  console.log("env.public.graphqlUrl", env.public.graphqlUrl);
  const client = new ApolloClient({
    ssrMode: env.server.isServer,
    cache: new InMemoryCache(),
    defaultOptions: {
      watchQuery: {
        fetchPolicy: "no-cache",
        errorPolicy: "all",
      },
      query: {
        fetchPolicy: "no-cache",
        errorPolicy: "all",
      },
    },
    link: new HttpLink({
      uri: env.public.graphqlUrl,
      headers: {
        authorization: token ? `Bearer user-mptc.${token}` : "",
        "apollo-require-preflight": "true",
        "apollographql-client-name": "file-upload",
        "apollographql-client-version": "v4",
      },
    }),
  });
  return client;
};
