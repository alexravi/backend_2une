import { BlobServiceClient } from '@azure/storage-blob';

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const containerName = process.env.AZURE_STORAGE_CONTAINER || 'media';

let blobServiceClient: BlobServiceClient | null = null;

export function getBlobServiceClient(): BlobServiceClient | null {
    if (!connectionString) return null;
    if (!blobServiceClient) {
        blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    }
    return blobServiceClient;
}

export async function uploadToBlob(
    blobPath: string,
    buffer: Buffer,
    contentType: string
): Promise<string> {
    const client = getBlobServiceClient();
    if (!client) {
        throw new Error('Azure Storage is not configured. Set AZURE_STORAGE_CONNECTION_STRING.');
    }
    const container = client.getContainerClient(containerName);
    await container.createIfNotExists();
    const blockBlob = container.getBlockBlobClient(blobPath);
    await blockBlob.uploadData(buffer, {
        blobHTTPHeaders: { blobContentType: contentType },
    });
    return blockBlob.url;
}
