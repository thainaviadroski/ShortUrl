import { eq } from "drizzle-orm";
import { DbClient } from "@/db";
import { users } from "@/db/schema";

type NewUser = typeof users.$inferInsert;
type UpdateUser = Partial<NewUser>;

export class UserRepository {

    constructor(private client: DbClient) { }

    async getAllUsers() {
        return await this.client.select().from(users);
    }

    async getUserById(id: number) {
        const [user] = await this.client.select().from(users).where(eq(users.id, id));
        return user;
    }

    async getUserByEmail(email: string) {
        const [user] = await this.client.select().from(users).where(eq(users.email, email));
        return user;
    }

    async createUser(data: NewUser) {
        const [created] = await this.client.insert(users).values(data).returning();
        return created;
    }

    async updateUser(id: number, data: UpdateUser) {
        const [updated] = await this.client
            .update(users)
            .set(data)
            .where(eq(users.id, id))
            .returning();
        return updated;
    }

    async deleteUser(id: number) {
        const [deleted] = await this.client
            .delete(users)
            .where(eq(users.id, id))
            .returning();
        return deleted;
    }

}
