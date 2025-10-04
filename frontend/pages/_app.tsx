// frontend/pages/_app.tsx
import type { AppProps } from "next/app";
import { ApolloProvider } from "@apollo/client/react";
import { client } from "../apolloClient";
import { Toaster } from "react-hot-toast";
export default function App({ Component, pageProps }: AppProps) {
  return (
    <ApolloProvider client={client}>
      <Component {...pageProps} />
      <Toaster position="top-center" />
    </ApolloProvider>
  );
}
