import { InMemoryUsersRepository } from "@modules/users/repositories/in-memory/InMemoryUsersRepository";
import { CreateUserUseCase } from "../createUser/CreateUserUseCase";
import { AuthenticateUserUseCase } from "./AuthenticateUserUseCase";
import { IncorrectEmailOrPasswordError } from "./IncorrectEmailOrPasswordError";

let createUserUseCase: CreateUserUseCase;
let authenticateUserUseCase: AuthenticateUserUseCase;
let inMemoryUsersRepository: InMemoryUsersRepository;

describe("Authenticate a user", () => {
    beforeAll(() => {
        inMemoryUsersRepository = new InMemoryUsersRepository();
        createUserUseCase = new CreateUserUseCase(inMemoryUsersRepository);
        authenticateUserUseCase = new AuthenticateUserUseCase(inMemoryUsersRepository);
    });

    it("should be able to authenticate a user", async () => {
        const user = {
            name: "test",
            email: "test@example.com",
            password: "admin",
        };

        await createUserUseCase.execute(user);

        const login = await authenticateUserUseCase.execute({
            email: user.email,
            password: user.password
        });

        expect(login.user).toHaveProperty("id");
        expect(login).toHaveProperty("token");
    });

    it("should not to be able to authenticate a user with a invalid email", async () => {
        const user = {
            name: "test2",
            email: "test2@example.com",
            password: "admin",
        };

        await createUserUseCase.execute(user);

        await expect(authenticateUserUseCase.execute({
                email: "1",
                password: user.password
            })
        ).rejects.toBeInstanceOf(IncorrectEmailOrPasswordError);
    });

    it("should not to be able to authenticate a user with a invalid password", async () => {
        const user = {
            name: "test3",
            email: "test3@example.com",
            password: "admin",
        };

        await createUserUseCase.execute(user);

        await expect(authenticateUserUseCase.execute({
                email: user.email,
                password: "1"
            })
        ).rejects.toBeInstanceOf(IncorrectEmailOrPasswordError);
    });
})