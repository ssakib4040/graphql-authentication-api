import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import jwt from "jsonwebtoken";

const SECRET_KEY = "your-secret-key";

// Sample user data for demonstration purposes
const users = [
  { id: 1, username: "user123", password: "password123" },
  { id: 2, username: "anotheruser", password: "pass456" },
];

const typeDefs = `
  type Query {
    hello: String
    authenticatedData: String
  }

  type Mutation {
    login(username: String!, password: String!): String
    logout: String
  }
`;

const resolvers = {
  Query: {
    hello: (a: any, b: any, context: any) => {
      const { user } = context;

      return "Hello World!";
    },
    authenticatedData: (a: any, b: any, { user }: any) => {
      if (user) {
        return "This data is only accessible to authenticated users.";
      } else {
        throw new Error("Not authenticated");
      }
    },
  },

  Mutation: {
    login: (a: any, { username, password }: any) => {
      // Find user by username and password
      const user = users.find(
        (u) => u.username === username && u.password === password
      );

      if (user) {
        // Generate a JWT token with user data
        const token = jwt.sign({ user }, SECRET_KEY);

        // Return the token
        return token;
      } else {
        throw new Error("Invalid credentials");
      }
    },
    logout: () => {
      // Logging out just means removing the token
      return "Logged out successfully";
    },
  },
};

const authenticateUser = (req: any) => {
  const token = req.headers.authorization || "";

  try {
    // verify the token
    const decoded: any = jwt.verify(token, SECRET_KEY);

    // get the user from the decoded token
    const user = decoded.user;

    // return the decoded user
    return user;
  } catch (error) {
    return null;
    // throw new Error("Authentication failed!");
  }
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  nodeEnv: "production",
});

async function startServer() {
  const { url } = await startStandaloneServer(server, {
    context: async ({ req }) => {
      const user = authenticateUser(req);
      return { user };
    },
  });
  console.log(`🚀 Server ready at ${url}`);
}

startServer();
