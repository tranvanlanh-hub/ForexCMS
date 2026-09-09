export type StorageConfig = {
  endpoint: string;
  region: string;
  bucket: string;
  publicBaseUrl: string;
};

export function getStorageConfig(): StorageConfig {
  return {
    endpoint: process.env.S3_ENDPOINT ?? "",
    region: process.env.S3_REGION ?? "",
    bucket: process.env.S3_BUCKET ?? "",
    publicBaseUrl: process.env.S3_PUBLIC_BASE_URL ?? "",
  };
}
