import { LoggerModule } from '@hl8/logger';
import { Module } from '@nestjs/common';
import { FileService } from './file.service';

@Module({
  imports: [LoggerModule],
  exports: [FileService],
  providers: [FileService],
})
export class FileModule {}
