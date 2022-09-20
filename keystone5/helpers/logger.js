const winston = require('winston');

const enumerateErrorFormat = winston.format((info) => {
  if (info instanceof Error) {
    Object.assign(info, {message: info.stack});
  }
  return info;
});

module.exports = (service) =>
  winston.createLogger({
    level: process.env.NODE_ENV !== 'production' ? 'debug' : 'info',
    format: winston.format.combine(
      enumerateErrorFormat(),
      process.env.NODE_ENV !== 'production'
        ? winston.format.colorize()
        : winston.format.uncolorize(),
      winston.format.splat(),
      winston.format.printf(({level, message}) => `[${service}] ${level}: ${message}`),
    ),
    transports: [
      new winston.transports.Console({
        stderrLevels: ['error'],
      }),
    ],
  });
