'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.Logger = exports.PinoLogger = void 0;
class Logger {
  log() {}
  error() {}
  warn() {}
  debug() {}
  verbose() {}
  fatal() {}
}
exports.Logger = Logger;
class PinoLogger extends Logger {}
exports.PinoLogger = PinoLogger;
