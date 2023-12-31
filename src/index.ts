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
        getAllProductsWithTerm(term: String): [Product]
    }
    

    type Mutation {
        createProduct(product: ProductInput): Product
        deleteProduct(id: String): Boolean
        updateProduct(id: String, product: ProductInput): Product
        setQuantity(id: String, quantity: Int): Boolean
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
    async getAllProductsWithTerm(_, args, contextValue) {
      const { term } = args;
      const result = await contextValue.couchbaseCluster.searchQuery(
        'index-products',
        couchbase.SearchQuery.match(term),
        {
          limit: 2,
        }
      );

      const bucket: Bucket =
        contextValue.couchbaseCluster.bucket('store-bucket');
      const collection: Collection = bucket
        .scope('products-scope')
        .collection('products');

      var productsArray = [];

      for (var i = 0; i < result.rows.length; i++) {
        const id = result.rows[i].id;
        const getResult: GetResult = await collection.get(id).catch((error) => {
          console.log(error);
          throw error;
        });

        productsArray.push(getResult.content);
      }
      return productsArray;
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
    async updateProduct(_, args, contextValue) {
      const { id, product } = args;
      const bucket: Bucket =
        contextValue.couchbaseCluster.bucket('store-bucket');
      const collection: Collection = bucket
        .scope('products-scope')
        .collection('products');

      const updatedMutationResult: MutationResult = await collection
        .replace(id, product)
        .catch((error) => {
          console.log(error);
          throw error;
        });

      return product;
    },
    async setQuantity(_, args, contextValue) {
      const { id, quantity } = args;
      const bucket: Bucket =
        contextValue.couchbaseCluster.bucket('store-bucket');
      const collection: Collection = bucket
        .scope('products-scope')
        .collection('products');
      const updatedMutationResult: MutationResult = await collection
        .mutateIn(id, [couchbase.MutateInSpec.replace('quantity', quantity)])
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
