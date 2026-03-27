import { env } from "@/config/env";
import { tokenStore } from "@/lib/upload/token-store";
import {
  ApolloClient,
  CombinedGraphQLErrors,
  ErrorLike,
  HttpLink,
  InMemoryCache,
} from "@apollo/client";
import { toast } from "sonner";

export const apolloClient = (token: string) => {
  console.log(`[Apollo] Pointing endpoint: ${env.public.graphqlUrl}`);

  tokenStore.set(token);

  const client = new ApolloClient({
    ssrMode: env.server.isServer,
    link: new HttpLink({
      uri: env.public.graphqlUrl,
      headers: {
        authorization: token ? `Bearer user-mptc.${token}` : "",
        "apollo-require-preflight": "true",
        "apollographql-client-name": "cmd-admin",
        "apollographql-client-version": "v4",
      },
    }),
    cache: new InMemoryCache(),
    defaultOptions: {
      watchQuery: { fetchPolicy: "no-cache", errorPolicy: "all" },
      query: { fetchPolicy: "no-cache", errorPolicy: "all" },
    },
  });

  return client;
};

export function apolloClientToastError(e: ErrorLike) {
  if (CombinedGraphQLErrors.is(e)) {
    const firstError = e.errors[0];
    if (firstError.extensions?.code !== "FORM_VALIDATION") {
      toast.error(e.message);
    }
  } else {
    toast.error(e.message);
  }
}
