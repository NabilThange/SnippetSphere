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
    const address = process.env.MILVUS_HOST || 'localhost:19530';
    const config: any = {
      address: address,
    };

    // Automatically enable SSL for HTTPS addresses (Zilliz Cloud serverless)
    if (address.startsWith('https://')) {
      config.address = address.replace('https://', ''); // Remove https:// for the address field
      config.ssl = true;
    }

    // Add authentication if using Zilliz Cloud
    if (process.env.MILVUS_TOKEN) {
      config.token = process.env.MILVUS_TOKEN;
    }

    milvusClient = new MilvusClient(config);
  }

  return milvusClient;
};

export { getMilvusClient }; 