import { SaveFileOptions } from '@/common/interfaces';
import { saveFileToS3 } from '@/common/utils';
import { deleteFile, deleteFiles, saveFile } from '@/common/utils/file';
import { EnvConfig } from '@/common/utils/validateEnv';
import { MemoryStorageFile } from '@blazity/nest-file-fastify';
import { GeneralBadRequestException } from '@hl8/exceptions';
import { Logger } from '@hl8/logger';
import { Injectable } from '@nestjs/common';

/**
 * Service for handling file operations such as upload and delete.
 */
@Injectable()
export class FileService {
  /**
   * Indicates whether the file system is public.
   * @type {boolean}
   */
  private readonly isPublic: boolean;

  /**
   * Creates an instance of FileService.
   *
   * @param {EnvConfig} config - Environment configuration for accessing environment variables.
   * @param {Logger} loggerService - Logger instance for logging errors.
   */
  constructor(
    private readonly config: EnvConfig,
    private readonly loggerService: Logger,
  ) {
    this.isPublic = this.config.FILE_SYSTEM === 'public';
  }

  /**
   * Uploads a single file to storage.
   *
   * @param {MemoryStorageFile} storageFile - The file to upload.
   * @param {SaveFileOptions} [options] - Optional file save options.
   * @returns {Promise<{ filename: string; filepath: string }>} The saved file's name and path.
   */
  async uploadFile(
    storageFile: MemoryStorageFile,
    options?: SaveFileOptions,
  ): Promise<{ filename: string; filepath: string }> {
    if (this.isPublic) {
      return await saveFile(storageFile, options);
    }
    return await saveFileToS3(storageFile, options);
  }

  /**
   * Deletes a file from storage.
   *
   * @param {string} path - The relative path of the file to delete.
   * @returns {Promise<void>}
   * @throws {BadRequestException} If deletion fails.
   */
  async deleteFile(path: string): Promise<void> {
    try {
      if (this.isPublic) {
        return await deleteFile(path);
      }
    } catch (e) {
      this.loggerService.error(e);
      const errorMessage = e instanceof Error ? e.message : '文件删除失败';
      throw new GeneralBadRequestException(
        [{ field: 'file', message: errorMessage }],
        '文件删除失败，请稍后重试',
        'FILE_DELETION_FAILED',
        e,
      );
    }
  }

  /**
   * Placeholder for uploading multiple files.
   */
  async uploadFiles(): Promise<void> {}

  /**
   * Placeholder for deleting multiple files.
   */
  async deleteFiles(filePaths: string[]) {
    try {
      if (this.isPublic) {
        return await deleteFiles(filePaths);
      }
    } catch (e) {
      this.loggerService.error(e);
      const errorMessage = e instanceof Error ? e.message : '批量文件删除失败';
      throw new GeneralBadRequestException(
        [{ field: 'files', message: errorMessage }],
        '批量文件删除失败，请稍后重试',
        'BATCH_FILE_DELETION_FAILED',
        e,
      );
    }
  }

  /**
   * Placeholder for creating a folder.
   */
  createFolder(): void {}

  /**
   * Placeholder for deleting a folder.
   */
  deleteFolder(): void {}
}
