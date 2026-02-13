import { oc } from '@orpc/contract';
import * as z from 'zod';
import { populateContractRouterPaths } from '@orpc/nest';

// Define routes:
const getHello = oc
  .route({ method: 'GET', path: '/' })
  .output(z.object({ message: z.string() }));

// Combine into a router:
export const contract = populateContractRouterPaths({
  hello: {
    get: getHello,
  },
});
