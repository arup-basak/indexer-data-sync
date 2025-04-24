import winston from "winston";

const logger = winston.createLogger({
  level: "error",
  format: winston.format.json(),
  transports: [new winston.transports.File({ filename: "error.log" })],
});

export const withErrorHandling = async <T>(
  fn: () => Promise<T>,
  context: string
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    logger.error({
      message: `Error in ${context}`,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
};
