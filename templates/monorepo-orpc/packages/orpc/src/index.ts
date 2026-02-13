import { oc } from '@orpc/contract';
import * as z from 'zod';
import { populateContractRouterPaths } from '@orpc/nest';

export const MessageSchema = z.object({ message: z.string() });
export type Message = z.infer<typeof MessageSchema>;

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
