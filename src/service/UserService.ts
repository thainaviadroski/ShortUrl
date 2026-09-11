import { users } from "@/db/schema";
import { CreateUserInput, UpdateUserInput } from "@/lib/models/user";
import { hashPassword } from "@/lib/password";
import { UserRepository } from "@/repository/UserRepository";

type UserRow = typeof users.$inferSelect;

function toPublicUser({ passwordHash: _passwordHash, ...user }: UserRow) {
    return user;
}

export class UserService {

    constructor(private repository: UserRepository) { }

    async listUsers() {
        const users = await this.repository.getAllUsers();
        return users.map(toPublicUser);
    }

    async getUserById(id: number) {
        const user = await this.repository.getUserById(id);
        return user ? toPublicUser(user) : undefined;
    }

    async createUser(input: CreateUserInput) {
        const { password, ...data } = input;

        const created = await this.repository.createUser({
            ...data,
            passwordHash: password ? hashPassword(password) : null,
        });

        return toPublicUser(created);
    }

    async updateUser(id: number, input: UpdateUserInput) {
        const { password, ...data } = input;

        const updated = await this.repository.updateUser(id, {
            ...data,
            ...(password ? { passwordHash: hashPassword(password) } : {}),
        });

        return updated ? toPublicUser(updated) : undefined;
    }

    async deleteUser(id: number) {
        const deleted = await this.repository.deleteUser(id);
        return deleted ? toPublicUser(deleted) : undefined;
    }

}
