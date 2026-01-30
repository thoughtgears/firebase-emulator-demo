const functions = require("firebase-functions");

/**
 * Structured logger for Cloud Functions
 */
class Logger {
  constructor(functionName) {
    this.functionName = functionName;
  }

  _log(severity, message, data = {}) {
    const logEntry = {
      severity,
      function: this.functionName,
      message,
      timestamp: new Date().toISOString(),
      ...data,
    };

    switch (severity) {
      case "DEBUG":
        functions.logger.debug(logEntry);
        break;
      case "INFO":
        functions.logger.info(logEntry);
        break;
      case "WARNING":
        functions.logger.warn(logEntry);
        break;
      case "ERROR":
        functions.logger.error(logEntry);
        break;
      default:
        functions.logger.log(logEntry);
    }
  }

  debug(message, data) {
    this._log("DEBUG", message, data);
  }

  info(message, data) {
    this._log("INFO", message, data);
  }

  warn(message, data) {
    this._log("WARNING", message, data);
  }

  error(message, data) {
    this._log("ERROR", message, data);
  }
}

module.exports = { Logger };
