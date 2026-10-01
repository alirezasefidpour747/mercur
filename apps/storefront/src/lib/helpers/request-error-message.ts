const record = (value: unknown): Record<string, unknown> | undefined =>
  typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : undefined

export const requestErrorMessage = (error: unknown, fallback: string): string => {
  const value = record(error)
  const data = record(record(value?.response)?.data)
  if (typeof data?.message === "string" && data.message) return data.message
  if (typeof value?.message === "string" && value.message) return value.message
  if (typeof error === "string" && error) return error
  return fallback
}
