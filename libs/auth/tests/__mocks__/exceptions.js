'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.GeneralUnauthorizedException = void 0;
class GeneralUnauthorizedException extends Error {
  code;
  constructor(message, code) {
    super(message);
    this.code = code;
    this.name = 'GeneralUnauthorizedException';
  }
}
exports.GeneralUnauthorizedException = GeneralUnauthorizedException;
//# sourceMappingURL=exceptions.js.map
