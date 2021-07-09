export async function handlePromise<T>(promise: Promise<T>): Promise<[T?, string?]> {
  try {
    const value = await promise
    return [value]
  } catch (e) {
    const errorMessage = e.message || 'Something went wrong'
    return [undefined, errorMessage]
  }
}

type ObjectWithMessages = { [message: string]: boolean }

export function getFirstTrueProperty(object: ObjectWithMessages): string {
  const [message] = Object.entries(object).find((entry) => entry[1]) || []
  return message
}
