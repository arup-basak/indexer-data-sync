import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

prisma
  .$use(async (params, next) => {
    console.info(`[PRISMA OPERATION]: ${params.model}.${params.action}`, params.args);
    const result = await next(params);
    console.info(`[PRISMA RESULT]:`, result);
    return result;
  });

prisma
  .$connect()
  .then(() => {
    console.info("⚡️[POSTGRESQL]: CONNECTED TO PRISMA DATABASE");
  })
  .catch((error) => {
    console.error("⚡️[POSTGRESQL]: ERROR CONNECTING TO DATABASE", error);
    process.exit(1);
  });

export default prisma;
