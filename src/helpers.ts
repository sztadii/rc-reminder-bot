export async function handlePromise<T>(promise: Promise<T>): Promise<[T?, string?]> {
  try {
    const value = await promise
    return [value]
  } catch (e) {
    const errorMessage = e.message || 'Something went wrong'
    return [undefined, errorMessage]
  }
}

type ErrorObject = { [key: string]: boolean }

export function getFirstTrueProperty(errorObject: ErrorObject): string {
  const [errorMessage] = Object.entries(errorObject).find((entry) => entry[1]) || []
  return errorMessage
}
