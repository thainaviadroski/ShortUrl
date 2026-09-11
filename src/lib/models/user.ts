import { z } from "zod/v4";
import { users } from "@/db/schema";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "./base";

export const createUserSchema = createInsertSchema(users, {
  email: (schema) => schema.email({ message: "Informe um e-mail válido" }),
})
  .omit({
    id: true,
    createdAt: true,
    passwordHash: true,
  })
  .extend({
    password: z.string().min(8, "A senha deve ter no mínimo 8 caracteres").optional(),
  });

export const updateUserSchema = createUpdateSchema(users, {
  email: (schema) => schema.email({ message: "Informe um e-mail válido" }),
})
  .omit({
    id: true,
    createdAt: true,
    passwordHash: true,
  })
  .extend({
    password: z.string().min(8, "A senha deve ter no mínimo 8 caracteres").optional(),
  });

export const userSchema = createSelectSchema(users);

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type User = z.infer<typeof userSchema>;
