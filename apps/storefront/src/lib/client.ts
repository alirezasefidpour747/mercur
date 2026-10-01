import { createClient, InferClient } from '@mercurjs/client';

import type { NativeRoutes } from './native-routes';

const MEDUSA_BACKEND_URL = process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000';

export const sdk: InferClient<NativeRoutes> = createClient({
  baseUrl: MEDUSA_BACKEND_URL,
  fetchOptions: {
    headers: {
      'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY as string,
    },
  },
});
