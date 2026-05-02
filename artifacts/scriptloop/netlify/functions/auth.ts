import { auth } from "../../src/auth/server";

export default async (req: Request) => {
  return auth.handler(req);
};

export const config = {
  path: "/api/auth/*",
};
