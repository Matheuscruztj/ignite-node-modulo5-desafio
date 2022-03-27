import { InMemoryStatementsRepository } from "@modules/statements/repositories/in-memory/InMemoryStatementsRepository";
import { InMemoryUsersRepository } from "@modules/users/repositories/in-memory/InMemoryUsersRepository";
import { AuthenticateUserUseCase } from "@modules/users/useCases/authenticateUser/AuthenticateUserUseCase";
import { CreateUserUseCase } from "@modules/users/useCases/createUser/CreateUserUseCase";
import { CreateStatementUseCase } from "@modules/statements/useCases/createStatement/CreateStatementUseCase";
import { GetBalanceError } from "./GetBalanceError";
import { GetBalanceUseCase } from "./GetBalanceUseCase";

let authenticateUserUseCase: AuthenticateUserUseCase;
let createUserUseCase: CreateUserUseCase;
let getBalanceUseCase: GetBalanceUseCase;
let createStatementUseCase: CreateStatementUseCase;

let inMemoryUsersRepository: InMemoryUsersRepository;
let inMemoryStatementsRepository: InMemoryStatementsRepository;

enum OperationType {
    DEPOSIT = 'deposit',
    TRANSFER = 'transfer'
}

describe("Get User Balance", () => {
    beforeAll(() => {
        inMemoryUsersRepository = new InMemoryUsersRepository();
        inMemoryStatementsRepository = new InMemoryStatementsRepository();

        authenticateUserUseCase = new AuthenticateUserUseCase(inMemoryUsersRepository);
        createUserUseCase = new CreateUserUseCase(inMemoryUsersRepository);
        getBalanceUseCase = new GetBalanceUseCase(inMemoryStatementsRepository, inMemoryUsersRepository);
        createStatementUseCase = new CreateStatementUseCase(inMemoryUsersRepository, inMemoryStatementsRepository);
    });

    it("should be able to get user balance", async () => {
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

        const balance = await getBalanceUseCase.execute({
            user_id: login.user.id as string
        });

        expect(balance).toHaveProperty("statement");
        expect(balance).toHaveProperty("balance");
        expect(balance.statement.length).toBe(0);
        expect(balance.balance).toBe(0);
    });

    it("should not to be able to get user balance", async () => {
        await expect(async () => {
            const user_id = "1";
    
            const balance = await getBalanceUseCase.execute({
                user_id,
            });
        }).rejects.toBeInstanceOf(GetBalanceError);
    });

    //new test
    it("should be able to get positive balance after transfer received", async () => {
        const user1 = {
            name: "test4",
            email: "test4@example.com",
            password: "admin",
        };

        const user2 = {
            name: "test5",
            email: "test5@example.com",
            password: "admin",
        };

        await createUserUseCase.execute(user1);
        await createUserUseCase.execute(user2);

        const login1 = await authenticateUserUseCase.execute({
            email: user1.email,
            password: user1.password
        });

        const login2 = await authenticateUserUseCase.execute({
            email: user2.email,
            password: user2.password
        });

        await createStatementUseCase.execute({
            user_id: login1.user.id as string,
            type: OperationType.DEPOSIT,
            amount: 10,
            description: "Description Test"
        });

        await createStatementUseCase.execute({
            user_id: login1.user.id as string,
            type: OperationType.TRANSFER,
            amount: 10,
            description: "Description Test",
            receiver_id: login2.user.id as string,
        });

        const balance = await getBalanceUseCase.execute({
            user_id: login2.user.id as string
        });

        expect(balance).toHaveProperty("statement");
        expect(balance).toHaveProperty("balance");
        expect(balance.statement.length).toBe(1);
        expect(balance.balance).toBe(10);
    });
})
