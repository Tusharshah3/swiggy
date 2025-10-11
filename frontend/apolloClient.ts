// frontend/apolloClient.ts
import { ApolloClient, InMemoryCache, HttpLink, ApolloLink } from "@apollo/client";

const httpLink = new HttpLink({
  uri: "process.env.NEXT_PUBLIC_API_URL + '/query'," // ⛳ change later to Railway backend
});

const authLink = new ApolloLink((operation, forward) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    operation.setContext(({ headers = {} }) => ({
      headers: {
        ...headers,
        Authorization: token ? `Bearer ${token}` : "",
      },
    }));
  }
  return forward(operation);
});

export const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});
