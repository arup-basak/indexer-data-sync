async function jobWrapper<T>(fn: () => Promise<T>): Promise<T> {
  try {
    const startTime = Date.now();
    const result = await fn();
    const duration = Date.now() - startTime;
    console.info(`Job completed in ${duration}ms`);
    return result;
  } catch (err) {
    console.error("Function execution failed:", err);
    throw err;
  }
}

export default jobWrapper;
