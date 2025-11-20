import { FileValidator } from '@nestjs/common';
import { IFile } from '@nestjs/common/pipes/file/interfaces';

export interface FileTypeValidatorOptions {
  fileType: string[];
}

/**
 * 文件类型验证器管道，用于验证上传文件的 MIME 类型。
 *
 * @description 验证传入文件的 MIME 类型是否匹配允许的文件类型列表。
 * 注意：此验证器使用简单的策略检查 MIME 类型，如果客户端提供了重命名扩展名的文件可能会被欺骗。
 * （例如，将 'malicious.bat' 重命名为 'malicious.jpeg'）。
 * 为了更可靠地处理此类安全问题，建议检查文件的[魔数](https://en.wikipedia.org/wiki/Magic_number_%28programming%29)。
 *
 * @see [File Validators](https://docs.nestjs.com/techniques/file-upload#validators)
 */
export class FileTypeValidatorPipe extends FileValidator<
  FileTypeValidatorOptions,
  IFile
> {
  /**
   * 构建错误消息。
   *
   * @description 当文件类型验证失败时，返回包含允许文件类型的错误消息。
   *
   * @returns 格式化的错误消息字符串。
   */
  buildErrorMessage(): string {
    return `File must be ${this.validationOptions.fileType}`;
  }

  /**
   * 验证文件类型是否有效。
   *
   * @description 检查文件是否存在且 MIME 类型在允许的文件类型列表中。
   *
   * @param {IFile} file - 要验证的文件对象。
   * @returns 如果文件类型有效返回 true，否则返回 false。
   */
  isValid(file?: IFile): boolean {
    if (!this.validationOptions) {
      return true;
    }

    return (
      !!file &&
      'mimetype' in file &&
      this.validationOptions.fileType.includes(file.mimetype)
    );
  }
}
