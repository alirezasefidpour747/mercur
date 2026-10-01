import { createClient, type InferClient } from "@mercurjs/client"
import type { NativeRoutes } from './native-routes'

declare const __BACKEND_URL__: string

export const client: InferClient<NativeRoutes> = createClient({
    baseUrl: __BACKEND_URL__,
    fetchOptions: {
        credentials: 'include',
    }
})
