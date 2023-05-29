import express from "express";
import http from "http";
import cors from "cors";
import session from "express-session";

import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { json } from "body-parser";

const app = express();
// Express session configuration
app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: false,
  })
);

const users = [
  { username: "john123", password: "password123" },
  { username: "jane123", password: "password12" },
];

const typeDefs = `#graphql
  type Query {
    hello: String
    getProtectedData: String
  }

  type Mutation {
    login(username: String!, password: String!): String
    logout: String
  }

`;

const resolvers = {
  Query: {
    hello: () => "Hello world!",
    getProtectedData: (a: any, b: any, { req }: any) => {
      const user = req.session.user;
      if (!user) {
        throw new Error("You are not authorized to view this data");
      }

      return "Protected data";
    },
  },

  Mutation: {
    login: async (_: any, { username, password }: any, { req }: any) => {
      if (!username || !password) {
        throw new Error("Please provide username and password");
      }

      const user = users.find(
        (user) => user.username === username && user.password === password
      );

      if (!user) {
        throw new Error("Invalid credentials");
      }

      // console.log(req);
      req.session.user = user;
      return "Logged in successfully";
    },

    logout: async (_: any, __: any, { req }: any) => {
      req.session.destroy();
      return "Logged out successfully";
    },
  },
};

interface MyContext {
  token?: String;
}

const httpServer = http.createServer(app);
const server = new ApolloServer<MyContext>({
  typeDefs,
  resolvers,
  plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
});

async function main() {
  await server.start();
  app.use(
    "/graphql",
    cors<cors.CorsRequest>(),
    json(),
    expressMiddleware(server, {
      context: async ({ req }) => ({ req }),
    })
  );

  await new Promise<void>((resolve) =>
    httpServer.listen({ port: 4000 }, resolve)
  );
  console.log(`🚀 Server ready at http://localhost:4000/graphql`);
}

main();
