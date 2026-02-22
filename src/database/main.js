import { MongoClient } from "mongodb";

let client;
let dbConnection;

export const connectDb = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not defined. Check your .env file.");

  if (dbConnection) return dbConnection;

  client = client ?? new MongoClient(uri);
  await client.connect();

  dbConnection = client.db("main");
  console.log("Successfully connected to MongoDB.");
  return dbConnection;
};

export const getDb = () => {
  if (!dbConnection) {
    throw new Error("Database not connected. Call connectToDb first.");
  }
  return dbConnection;
};

export const getClient = () => {
  if (!client) {
    throw new Error("Mongo client not connected. Call connectToDb first.");
  }
  return client;
};
