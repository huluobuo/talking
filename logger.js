// logger.js
import winston from 'winston';
import chalk from 'chalk';

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => {
            const color = level === 'error' ? chalk.red :
                          level === 'warn' ? chalk.yellow :
                          level === 'info' ? chalk.green :
                          chalk.white;
            return `${color(timestamp)} [${chalk.bold(level.toUpperCase())}]: ${message}`;
        })
    ),
    transports: [
        new winston.transports.File({ filename: 'talker.log' }),
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        })
    ]
});

export default logger;