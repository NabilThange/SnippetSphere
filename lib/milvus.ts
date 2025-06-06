// lib/milvus.ts
import { MilvusClient, DataType } from '@zilliz/milvus2-sdk-node';

const COLLECTION_NAME = 'code_embeddings';

const getMilvusClient = async () => {
  const config: any = {
    address: process.env.MILVUS_HOST || 'localhost',
    port: process.env.MILVUS_PORT ? parseInt(process.env.MILVUS_PORT) : 19530,
    ssl: true, // Always true for Zilliz Cloud
  };

  // Add token if available
  if (process.env.MILVUS_TOKEN) {
    config.token = process.env.MILVUS_TOKEN;
  }

  const client = new MilvusClient(config);

  // Ensure collection exists
  try {
    const hasCollection = await client.hasCollection({ collection_name: COLLECTION_NAME });
    
    if (!hasCollection.value) {
      // Create collection with explicit fields
      await client.createCollection({
        collection_name: COLLECTION_NAME,
        fields: [
          {
            name: 'id',
            data_type: DataType.Int64,
            is_primary_key: true,
            autoID: true
          },
          {
            name: 'content',
            data_type: DataType.VarChar,
            max_length: 65535
          },
          {
            name: 'file_path',
            data_type: DataType.VarChar,
            max_length: 1024
          },
          {
            name: 'embedding',
            data_type: DataType.FloatVector,
            dimension: 1536 // Adjust based on your embedding model
          }
        ],
        enable_dynamic_field: true
      });
    }
  } catch (error) {
    console.error('Error creating/checking collection:', error);
    throw error;
  }

  return client;
};

export { getMilvusClient, COLLECTION_NAME }; 