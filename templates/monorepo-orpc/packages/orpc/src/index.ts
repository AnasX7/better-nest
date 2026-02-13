import { oc } from '@orpc/contract';
import { populateContractRouterPaths } from '@orpc/nest';
import { MessageSchema } from '@repo/types/example';

// Define routes:
const getHello = oc
  .route({ method: 'GET', path: '/' })
  .output(MessageSchema);

// Combine into a router:
export const contract = populateContractRouterPaths({
  hello: {
    get: getHello,
  },
});
