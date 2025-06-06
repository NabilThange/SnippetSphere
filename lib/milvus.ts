// lib/milvus.ts
let MilvusClient: any = null;
let milvusClient: any = null;

// Only import Milvus in runtime, not during build
const getMilvusClient = async () => {
  // Skip during build process
  if (process.env.NODE_ENV === 'production' && !process.env.RUNTIME_EXECUTION) {
    throw new Error('Milvus not available during build');
  }

  if (!MilvusClient) {
    try {
      const milvusModule = await import('@zilliz/milvus2-sdk-node');
      MilvusClient = milvusModule.MilvusClient;
    } catch (error) {
      throw new Error('Failed to import Milvus SDK');
    }
  }

  if (!milvusClient) {
    milvusClient = new MilvusClient({
      address: process.env.MILVUS_HOST || 'localhost:19530',
    });
  }

  return milvusClient;
};

export { getMilvusClient }; 