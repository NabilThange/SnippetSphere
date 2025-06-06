import { MilvusClient, DataType } from '@zilliz/milvus2-sdk-node';

interface CodeChunk {
  id?: number;
  content: string;
  filePath: string;
  embedding: number[];
  sessionId: string;
}

class ZillizClient {
  private client: MilvusClient;
  private defaultCollectionName: string = 'code_embeddings';

  constructor(uri: string, token: string) {
    this.client = new MilvusClient({
      address: uri,
      token: token,
    });
  }

  async createCollection(collectionName: string, dimension: number): Promise<void> {
    try {
      const hasCollection = await this.client.hasCollection({ collection_name: collectionName });
      if (!hasCollection.value) {
        await this.client.createCollection({
          collection_name: collectionName,
          dimension: dimension,
          metric_type: 'COSINE', // Cosine similarity for embeddings
          id_type: DataType.Int64,
          field_name: 'id',
          auto_id: true,
          enable_dynamic_field: true, // Allows flexible fields like filePath, content, sessionId
        });
        console.log(`Collection ${collectionName} created successfully.`);
      } else {
        console.log(`Collection ${collectionName} already exists.`);
      }
    } catch (error) {
      console.error(`Error creating collection ${collectionName}:`, error);
      throw new Error(`Failed to create collection: ${error}`);
    }
  }

  async insertVectors(data: CodeChunk[]): Promise<any> {
    try {
      const formattedData = data.map(chunk => ({
        vector: chunk.embedding,
        content: chunk.content,
        filePath: chunk.filePath,
        sessionId: chunk.sessionId,
      }));

      const result = await this.client.insert({
        collection_name: this.defaultCollectionName,
        data: formattedData,
      });
      console.log('Vectors inserted successfully:', result);
      return result;
    } catch (error) {
      console.error('Error inserting vectors:', error);
      throw new Error(`Failed to insert vectors: ${error}`);
    }
  }

  async searchVectors(vector: number[], sessionId: string, limit: number = 10): Promise<CodeChunk[]> {
    try {
      const searchResult = await this.client.search({
        collection_name: this.defaultCollectionName,
        vectors: [vector],
        limit: limit,
        output_fields: ['content', 'filePath', 'sessionId'],
        filter: `sessionId == "${sessionId}"`,
      });

      const results: CodeChunk[] = [];
      if (searchResult.results && searchResult.results[0]) {
        searchResult.results[0].forEach((hit: any) => {
          results.push({
            id: hit.id,
            content: hit.content,
            filePath: hit.filePath,
            embedding: hit.vector, // Zilliz returns the vector as well
            sessionId: hit.sessionId,
            similarity: hit.score, // Zilliz returns the similarity score
          });
        });
      }
      console.log('Search completed successfully:', results);
      return results;
    } catch (error) {
      console.error('Error searching vectors:', error);
      throw new Error(`Failed to search vectors: ${error}`);
    }
  }

  async queryBySessionId(sessionId: string): Promise<CodeChunk[]> {
    try {
      const queryResult = await this.client.query({
        collection_name: this.defaultCollectionName,
        filter: `sessionId == "${sessionId}"`,
        output_fields: ['content', 'filePath', 'embedding', 'sessionId'],
      });

      const results: CodeChunk[] = [];
      if (queryResult.data) {
        queryResult.data.forEach((item: any) => {
          results.push({
            id: item.id,
            content: item.content,
            filePath: item.filePath,
            embedding: item.embedding,
            sessionId: item.sessionId,
          });
        });
      }
      console.log(`Queried data for session ${sessionId}:`, results.length);
      return results;
    } catch (error) {
      console.error(`Error querying data for session ${sessionId}:`, error);
      throw new Error(`Failed to query session data: ${error}`);
    }
  }

  // You might want methods for deleting collections/data by sessionId as well.
  async deleteSessionData(sessionId: string): Promise<any> {
    try {
      const result = await this.client.delete({
        collection_name: this.defaultCollectionName,
        filter: `sessionId == "${sessionId}"`, // Delete all data associated with the session
      });
      console.log(`Data for session ${sessionId} deleted successfully:`, result);
      return result;
    } catch (error) {
      console.error(`Error deleting data for session ${sessionId}:`, error);
      throw new Error(`Failed to delete session data: ${error}`);
    }
  }
}

export default ZillizClient; 