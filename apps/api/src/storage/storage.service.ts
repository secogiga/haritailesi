import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

// MinIO S3-compatible API kullanılır
// İleride cloud provider'a geçiş sadece env değişkeni değişikliğidir

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(private readonly config: ConfigService) {
    const endpoint = config.getOrThrow<string>('MINIO_ENDPOINT');
    const port = config.get<number>('MINIO_PORT', 9000);
    const useSSL = config.get<string>('MINIO_USE_SSL', 'false') === 'true';

    this.client = new S3Client({
      endpoint: `${useSSL ? 'https' : 'http'}://${endpoint}:${port}`,
      region: 'us-east-1', // MinIO için region önemli değil ama zorunlu
      credentials: {
        accessKeyId: config.getOrThrow<string>('MINIO_ROOT_USER'),
        secretAccessKey: config.getOrThrow<string>('MINIO_ROOT_PASSWORD'),
      },
      forcePathStyle: true, // MinIO için zorunlu
    });

    this.bucket = config.get<string>('MINIO_BUCKET', 'haritailesi');
  }

  async upload(
    buffer: Buffer,
    options: {
      folder: string;
      originalFilename: string;
      mimeType: string;
    },
  ): Promise<{ key: string; url: string }> {
    const ext = options.originalFilename.split('.').pop() ?? '';
    const key = `${options.folder}/${randomUUID()}${ext ? `.${ext}` : ''}`;

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: options.mimeType,
        Metadata: { originalFilename: options.originalFilename },
      }),
    );

    return { key, url: await this.getSignedUrl(key) };
  }

  async getSignedUrl(key: string, expiresInSeconds = 3600): Promise<string> {
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
  }

  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
    this.logger.log(`Deleted: ${key}`);
  }
}
