"use client"; // important: must be a client component

import { apolloClient } from "@/lib/apollo-client";
import { ApolloProvider } from "@apollo/client/react";

export function ApolloWrapper({ children }: { children: React.ReactNode }) {
  const client = apolloClient(""); // optionally pass token
  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}
