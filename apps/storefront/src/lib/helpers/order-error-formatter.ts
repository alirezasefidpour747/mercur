export const orderErrorFormatter = (error: unknown) => {
  const message =
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
      ? error.message
      : String(error)

  if (message === "NEXT_REDIRECT") {
    return null
  }

  if (message.includes("Not enough stock available")) {
    return "Not enough stock available"
  }

  return message
}
