import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import couchbase, {
  Bucket,
  Collection,
  GetResult,
  MutationResult,
} from 'couchbase';
import { v4 as uuidv4 } from 'uuid';

const typeDefs = `#graphql 
    type Product {
        name: String,
        price: Float,
        quantity: Int,
        tags: [String]
    }

    input ProductInput {
        name: String,
        price: Float,
        quantity: Int,
        tags: [String]
    }

    type Query {
        getProduct(id: String): Product
    }
    

    type Mutation {
        createProduct(product: ProductInput): Product
        deleteProduct(id: String): Boolean
    }
`;

/* mutations....

- createProduct
- deleteProduct
- updateProduct
*/

const resolvers = {
  Query: {
    async getProduct(_, args, contextValue) {
      const { id } = args;

      const bucket: Bucket =
        contextValue.couchbaseCluster.bucket('store-bucket');
      const collection: Collection = bucket
        .scope('products-scope')
        .collection('products');

      const getResult: GetResult = await collection.get(id).catch((error) => {
        console.log(error);
        throw error;
      });

      return getResult.content;
    },
  },
  Mutation: {
    async createProduct(_, args, contextValue) {
      const { product } = args;
      const bucket: Bucket =
        contextValue.couchbaseCluster.bucket('store-bucket');
      const collection: Collection = bucket
        .scope('products-scope')
        .collection('products');

      const key = uuidv4();

      const createMutationResult: MutationResult = await collection
        .insert(key, product)
        .catch((error) => {
          console.log(error);
          throw error;
        });

      return product;
    },
    async deleteProduct(_, args, contextValue) {
      const { id } = args;
      const bucket: Bucket =
        contextValue.couchbaseCluster.bucket('store-bucket');
      const collection: Collection = bucket
        .scope('products-scope')
        .collection('products');

      const deletedMutationResult: MutationResult = await collection
        .remove(id)
        .catch((error) => {
          console.log(error);
          throw error;
        });

      return true;
    },
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

// User inputs
const clusterConnStr = 'couchbases://cb.gplt-bcrmofa2spt.cloud.couchbase.com'; // Replace this with Connection String
const username = 'coopercodes'; // Replace this with username from database access credentials
const password = 'Coopercodes123!'; // Replace this with password from database access credentials

const { url } = await startStandaloneServer(server, {
  listen: { port: 4000 },
  context: async ({ req, res }) => ({
    couchbaseCluster: await couchbase.connect(clusterConnStr, {
      username: username,
      password: password,
      configProfile: 'wanDevelopment',
    }),
  }),
});

console.log('Server up on ' + url);
