import { FileValidator } from '@nestjs/common';
import { IFile } from '@nestjs/common/pipes/file/interfaces';

export interface FileSizeValidatorOptions {
  fileSize: number;
}

/**
 * 文件大小验证器管道，用于验证上传文件的大小。
 *
 * @description 验证传入文件的大小是否小于指定的最大文件大小限制。
 * 如果文件大小超过限制，将返回错误消息。
 *
 * @see [File Validators](https://docs.nestjs.com/techniques/file-upload#validators)
 */
export class FileSizeValidatorPipe extends FileValidator<
  FileSizeValidatorOptions,
  IFile
> {
  /**
   * 构建错误消息。
   *
   * @description 当文件大小验证失败时，返回包含最大文件大小的错误消息。
   *
   * @returns 格式化的错误消息字符串。
   */
  buildErrorMessage(): string {
    return `Max file size is ${(this.validationOptions.fileSize * 0.000001).toFixed()} Mb`;
  }

  /**
   * 验证文件大小是否有效。
   *
   * @description 检查文件是否存在且大小小于配置的最大文件大小。
   *
   * @param {IFile} file - 要验证的文件对象。
   * @returns 如果文件大小有效返回 true，否则返回 false。
   */
  isValid(file?: IFile): boolean {
    if (!this.validationOptions) {
      return true;
    }

    return (
      !!file &&
      'mimetype' in file &&
      +file.size < this.validationOptions.fileSize
    );
  }
}
