"use client";
import { apolloClient } from "@/lib/apollo-client";
import { ApolloProvider } from "@apollo/client/react";

export function ApolloWrapper({ children }: { children: React.ReactNode }) {
  const client = apolloClient("");

  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}
