import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().min(1).max(255).email(),
  password: z.string().min(8).max(128),
});

export type LoginInput = z.infer<typeof loginSchema>;
