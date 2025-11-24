'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.GeneralBadRequestException =
  exports.GeneralForbiddenException =
  exports.GeneralInternalServerException =
  exports.GeneralUnauthorizedException =
  exports.GeneralNotFoundException =
    void 0;
class GeneralBadRequestException extends Error {
  code;
  constructor(message, code) {
    super(typeof message === 'string' ? message : message.message);
    this.code = code;
    this.name = 'GeneralBadRequestException';
  }
}
exports.GeneralBadRequestException = GeneralBadRequestException;
class GeneralForbiddenException extends Error {
  code;
  constructor(message, code) {
    super(message);
    this.code = code;
    this.name = 'GeneralForbiddenException';
  }
}
exports.GeneralForbiddenException = GeneralForbiddenException;
class GeneralInternalServerException extends Error {
  cause;
  constructor(message, cause) {
    super(message);
    this.cause = cause;
    this.name = 'GeneralInternalServerException';
  }
}
exports.GeneralInternalServerException = GeneralInternalServerException;
class GeneralUnauthorizedException extends Error {
  code;
  constructor(message, code) {
    super(message);
    this.code = code;
    this.name = 'GeneralUnauthorizedException';
  }
}
exports.GeneralUnauthorizedException = GeneralUnauthorizedException;
class GeneralNotFoundException extends Error {
  code;
  constructor(message, code) {
    super(message);
    this.code = code;
    this.name = 'GeneralNotFoundException';
  }
}
exports.GeneralNotFoundException = GeneralNotFoundException;
