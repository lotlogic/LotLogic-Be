import {
  BlobSASPermissions,
  BlobServiceClient,
  ContainerClient,
  SASProtocol,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
} from '@azure/storage-blob';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { extname } from 'node:path';

export interface AdminUploadRequest {
  fileName: string;
  contentType?: string;
  size?: number;
  folder?: string;
}

export interface AdminUploadResponse {
  uploadUrl: string;
  assetUrl: string;
  blobPath: string;
  expiresAt: string;
  method: 'PUT';
  headers: Record<string, string>;
  maxBytes: number;
}

@Injectable()
export class AdminUploadService {
  private blobServiceClient: BlobServiceClient | null = null;
  private containerClient: ContainerClient | null = null;
  private sharedKeyCredential: StorageSharedKeyCredential | null = null;

  async createUploadUrl(request: AdminUploadRequest): Promise<AdminUploadResponse> {
    const fileName = String(request.fileName || '').trim();
    if (!fileName) {
      throw new BadRequestException('Missing fileName');
    }

    const contentTypeRaw = String(request.contentType || '').trim();
    const contentType = contentTypeRaw || undefined;
    const size = typeof request.size === 'number' ? request.size : undefined;
    const maxBytes = this.getMaxUploadBytes_();
    if (size !== undefined && size > maxBytes) {
      throw new BadRequestException(
        `File exceeds max upload size (${maxBytes} bytes)`,
      );
    }

    const folder = this.sanitizeSegment_(request.folder) || 'misc';
    this.validateFolderUpload_(folder, contentType);
    const uploadsFolder = this.getUploadsFolder_();
    const blobName = this.buildBlobName_(fileName, uploadsFolder, folder);

    const { containerClient, sharedKeyCredential } = this.ensureClients_();
    await containerClient.createIfNotExists();

    const blobClient = containerClient.getBlockBlobClient(blobName);
    const now = new Date();
    const startsOn = new Date(now.getTime() - 5 * 60_000);
    const expiresOn = new Date(
      now.getTime() + this.getSasMinutes_() * 60_000,
    );

    const sasToken = generateBlobSASQueryParameters(
      {
        containerName: containerClient.containerName,
        blobName,
        permissions: BlobSASPermissions.parse('cw'),
        startsOn,
        expiresOn,
        protocol: SASProtocol.Https,
      },
      sharedKeyCredential,
    ).toString();

    const headers: Record<string, string> = {
      'x-ms-blob-type': 'BlockBlob',
    };
    if (contentType) {
      headers['Content-Type'] = contentType;
    }

    return {
      uploadUrl: `${blobClient.url}?${sasToken}`,
      assetUrl: blobClient.url,
      blobPath: blobName,
      expiresAt: expiresOn.toISOString(),
      method: 'PUT',
      headers,
      maxBytes,
    };
  }

  private ensureClients_(): {
    containerClient: ContainerClient;
    sharedKeyCredential: StorageSharedKeyCredential;
  } {
    const connectionString = this.getConnectionString_();
    const containerName = this.getContainerName_();

    if (!this.blobServiceClient) {
      this.blobServiceClient = BlobServiceClient.fromConnectionString(
        connectionString,
      );
    }

    if (
      !this.containerClient ||
      this.containerClient.containerName !== containerName
    ) {
      this.containerClient =
        this.blobServiceClient.getContainerClient(containerName);
    }

    if (!this.sharedKeyCredential) {
      const { accountName, accountKey } =
        this.parseConnectionString_(connectionString);
      this.sharedKeyCredential = new StorageSharedKeyCredential(
        accountName,
        accountKey,
      );
    }

    return {
      containerClient: this.containerClient,
      sharedKeyCredential: this.sharedKeyCredential,
    };
  }

  private buildBlobName_(
    fileName: string,
    uploadsFolder: string,
    folder: string,
  ): string {
    const ext = this.safeExtension_(fileName);
    const date = new Date();
    const yyyy = date.getUTCFullYear();
    const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(date.getUTCDate()).padStart(2, '0');
    const id = randomUUID();
    return [uploadsFolder, folder, `${yyyy}`, `${mm}`, `${dd}`, `${id}${ext}`]
      .filter(Boolean)
      .join('/');
  }

  private safeExtension_(fileName: string): string {
    const ext = extname(fileName).toLowerCase();
    if (!ext) return '';
    return /^\.[a-z0-9]{1,10}$/.test(ext) ? ext : '';
  }

  private sanitizeSegment_(value: unknown): string {
    const raw = String(value || '').trim().toLowerCase();
    if (!raw) return '';
    const cleaned = raw
      .replace(/[^a-z0-9-_]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return cleaned.slice(0, 60);
  }

  private getConnectionString_(): string {
    const value = String(process.env.AZURE_UPLOAD_STORAGE_CONNECTION_STRING || '').trim();
    if (!value) {
      throw new InternalServerErrorException(
        'Missing env var AZURE_UPLOAD_STORAGE_CONNECTION_STRING',
      );
    }
    return value;
  }

  private getContainerName_(): string {
    const value = String(process.env.AZURE_UPLOAD_STORAGE_CONTAINER || '').trim();
    if (!value) {
      throw new InternalServerErrorException(
        'Missing env var AZURE_UPLOAD_STORAGE_CONTAINER',
      );
    }
    return value;
  }

  private getUploadsFolder_(): string {
    const value = String(process.env.AZURE_STORAGE_UPLOADS_FOLDER || '').trim();
    return this.sanitizeSegment_(value) || 'uploads';
  }

  private getMaxUploadBytes_(): number {
    const raw = String(process.env.AZURE_UPLOAD_MAX_BYTES || '').trim();
    const parsed = raw ? Number(raw) : NaN;
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return 100 * 1024 * 1024;
    }
    return Math.floor(parsed);
  }

  private getSasMinutes_(): number {
    const raw = String(process.env.AZURE_UPLOAD_SAS_MINUTES || '').trim();
    const parsed = raw ? Number(raw) : NaN;
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return 15;
    }
    return Math.floor(parsed);
  }

  private parseConnectionString_(value: string): {
    accountName: string;
    accountKey: string;
  } {
    const pairs = value
      .split(';')
      .map((part) => part.trim())
      .filter(Boolean)
      .reduce<Record<string, string>>((acc, part) => {
        const idx = part.indexOf('=');
        if (idx === -1) return acc;
        const key = part.slice(0, idx).trim().toLowerCase();
        const val = part.slice(idx + 1);
        acc[key] = val;
        return acc;
      }, {});

    const accountName = pairs['accountname'];
    const accountKey = pairs['accountkey'];
    if (!accountName || !accountKey) {
      throw new InternalServerErrorException(
        'Invalid AZURE_UPLOAD_STORAGE_CONNECTION_STRING',
      );
    }
    return { accountName, accountKey };
  }

  private validateFolderUpload_(
    folder: string,
    contentType?: string,
  ): void {
    if (folder !== 'floorplans') {
      return;
    }

    if (!contentType || !contentType.toLowerCase().startsWith('image/')) {
      throw new BadRequestException(
        'Floor plan uploads must be marketing-ready image files.',
      );
    }
  }
}
