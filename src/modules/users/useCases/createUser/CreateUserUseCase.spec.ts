import { InMemoryUsersRepository } from "@modules/users/repositories/in-memory/InMemoryUsersRepository";
import { CreateUserError } from "./CreateUserError";
import { CreateUserUseCase } from "./CreateUserUseCase";

let createUserUseCase: CreateUserUseCase;
let inMemoryUsersRepository: InMemoryUsersRepository;

describe("Create User", () => {
    beforeEach(() => {
        inMemoryUsersRepository = new InMemoryUsersRepository();
        createUserUseCase = new CreateUserUseCase(inMemoryUsersRepository);
    })

    it("should be able to create a new user", async () => {
        const user = await createUserUseCase.execute({
            name: "test",
            email: "test@example.com",
            password: "admin",
        });

        expect(user).toHaveProperty("id");
    });

    it("should not be able to register a new user when email already exists", async () => {
        await createUserUseCase.execute({
            name: "test",
            email: "test@example.com",
            password: "admin",
        });

        await expect(createUserUseCase.execute({
                name: "test",
                email: "test@example.com",
                password: "admin",
            })
        ).rejects.toBeInstanceOf(CreateUserError);
    });
})