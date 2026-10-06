import { z } from "zod";

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export const badRequest = (m: string) => new HttpError(400, m);
export const unauthorized = (m = "Authentication required") =>
  new HttpError(401, m);
export const forbidden = (m = "You do not have permission to do that") =>
  new HttpError(403, m);
export const notFound = (m = "Not found") => new HttpError(404, m);
export const conflict = (m: string) => new HttpError(409, m);

export function parseOr400<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown,
): z.infer<T> {
  const r = schema.safeParse(data);
  if (!r.success) {
    const first = r.error.issues[0];
    throw badRequest(`${first.path.join(".") || "input"}: ${first.message}`);
  }
  return r.data;
}
