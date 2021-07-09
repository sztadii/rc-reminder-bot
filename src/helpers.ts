export async function handlePromise<T>(promise: Promise<T>): Promise<[T?, string?]> {
  try {
    const value = await promise
    return [value]
  } catch (e) {
    const errorMessage = e.message || 'Something went wrong'
    return [undefined, errorMessage]
  }
}
