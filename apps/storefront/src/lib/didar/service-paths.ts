export const didarServicePaths = {
  consumer: ["stores", "authenticity", "warranty", "buyback"],
  retailer: ["application", "catalog", "inquiries", "orders"],
  supplier: ["profile", "products", "review", "supply"],
  wholesaler: ["application", "cooperation", "requests"],
} as const

export type DidarRole = keyof typeof didarServicePaths
export function isDidarRole(value: string): value is DidarRole {
  return Object.prototype.hasOwnProperty.call(didarServicePaths, value)
}

export function isDidarService(role: DidarRole, value: string) {
  return (didarServicePaths[role] as readonly string[]).includes(value)
}
