import { MongoClient } from 'mongodb';

export const getDb = async (db_name: any) => {
  const MONGO_URL = process.env.MONGO_DB_URL;

  if (!MONGO_URL) {
    throw new Error('Missing MONGO_DB_URL env variable');
  }

  const client: any = await MongoClient.connect(MONGO_URL);
  return client.db();
};
