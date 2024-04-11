export async function withTimeout<T>(promise: Promise<T>, timeout = 60000, errorMessage = 'Operation timed out'): Promise<T> {
  let timeoutHandle;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutHandle = setTimeout(() => reject(new Error(errorMessage)), timeout);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutHandle);
  }
}