const asRecord = (value: unknown): Record<string, unknown> | undefined =>
  typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : undefined

export default function medusaError(error: unknown): never {
  const requestError = asRecord(error)
  const response = asRecord(requestError?.response)

  if (response) {
    const data = asRecord(response.data)
    const message =
      typeof data?.message === "string"
        ? data.message
        : typeof response.data === "string"
          ? response.data
          : typeof requestError?.message === "string"
            ? requestError.message
            : "Request failed"

    throw new Error(message.charAt(0).toUpperCase() + message.slice(1) + ".")
  }

  if (requestError?.request) {
    throw new Error("No response received: " + String(requestError.request))
  }

  const message =
    typeof requestError?.message === "string" ? requestError.message : String(error)
  throw new Error("Error setting up the request: " + message)
}
