import { InMemoryStatementsRepository } from "@modules/statements/repositories/in-memory/InMemoryStatementsRepository";
import { InMemoryUsersRepository } from "@modules/users/repositories/in-memory/InMemoryUsersRepository";
import { AuthenticateUserUseCase } from "@modules/users/useCases/authenticateUser/AuthenticateUserUseCase";
import { CreateUserUseCase } from "@modules/users/useCases/createUser/CreateUserUseCase";
import { AppError } from "@shared/errors/AppError";
import { GetBalanceUseCase } from "../getBalance/GetBalanceUseCase";
import { CreateStatementError } from "./CreateStatementError";
import { CreateStatementUseCase } from "./CreateStatementUseCase";

let authenticateUserUseCase: AuthenticateUserUseCase;
let createUserUseCase: CreateUserUseCase;
let createStatementUseCase: CreateStatementUseCase;

let inMemoryUsersRepository: InMemoryUsersRepository;
let inMemoryStatementsRepository: InMemoryStatementsRepository;

enum OperationType {
    DEPOSIT = 'deposit',
    WITHDRAW = 'withdraw',
    TRANSFER = 'transfer'
}

describe("Create a statement", () => {
    beforeAll(() => {
        inMemoryUsersRepository = new InMemoryUsersRepository();
        inMemoryStatementsRepository = new InMemoryStatementsRepository();

        authenticateUserUseCase = new AuthenticateUserUseCase(inMemoryUsersRepository);
        createUserUseCase = new CreateUserUseCase(inMemoryUsersRepository);
        createStatementUseCase = new CreateStatementUseCase(inMemoryUsersRepository, inMemoryStatementsRepository);
    });

    it("should create a deposit statement", async () => {
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

        const statement = await createStatementUseCase.execute({
            user_id: login.user.id as string,
            type: OperationType.DEPOSIT,
            amount: 10,
            description: "Description Test",
        });

        expect(statement).toHaveProperty("id");
    });

    it("should create a withdraw statement", async () => {
        const user = {
            name: "test2",
            email: "test2@example.com",
            password: "admin",
        };

        await createUserUseCase.execute(user);

        const login = await authenticateUserUseCase.execute({
            email: user.email,
            password: user.password
        });

        await createStatementUseCase.execute({
            user_id: login.user.id as string,
            type: OperationType.DEPOSIT,
            amount: 100,
            description: "Description Test"
        });

        const statement = await createStatementUseCase.execute({
            user_id: login.user.id as string,
            type: OperationType.WITHDRAW,
            amount: 10,
            description: "Description Test"
        });

        expect(statement).toHaveProperty("id");
    });

    it("should not able to create a statement with insufficient funds", async () => {
        const user = {
            name: "test3",
            email: "test3@example.com",
            password: "admin",
        };

        await createUserUseCase.execute(user);

        const login = await authenticateUserUseCase.execute({
            email: user.email,
            password: user.password
        });

        await expect(createStatementUseCase.execute({
                user_id: login.user.id as string,
                type: OperationType.WITHDRAW,
                amount: 10,
                description: "Description Test"
            })
        ).rejects.toEqual(new CreateStatementError.InsufficientFunds());
    });

    it("should not able to create a statement with a invalid user", async () => {
        await expect(createStatementUseCase.execute({
                user_id: "123",
                type: OperationType.WITHDRAW,
                amount: 10,
                description: "Description Test"
            })
        ).rejects.toEqual(new CreateStatementError.UserNotFound());
    });

    /** new tests */
    it("should create a transfer statement", async () => {
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

        const statement2 = await createStatementUseCase.execute({
            user_id: login1.user.id as string,
            type: OperationType.TRANSFER,
            amount: 10,
            description: "Description Test",
            receiver_id: login2.user.id as string,
        });

        expect(statement2).toHaveProperty("id");
    });

    it("should not be able to transfer to the same sender", async () => {
        const user1 = {
            name: "Adele Griffin",
            email: "vuj@bisavom.gl",
            password: "admin",
        };

        await createUserUseCase.execute(user1);

        const login1 = await authenticateUserUseCase.execute({
            email: user1.email,
            password: user1.password
        });

        await createStatementUseCase.execute({
            user_id: login1.user.id as string,
            type: OperationType.DEPOSIT,
            amount: 10,
            description: "Description Test"
        });

        await expect(
            createStatementUseCase.execute({
                user_id: login1.user.id as string,
                type: OperationType.TRANSFER,
                amount: 10,
                description: "Description Test",
                receiver_id: login1.user.id as string,
            })
        ).rejects.toEqual(new CreateStatementError.OperationNotPermitted());
    });

    it("should not be able to create a transfer statement with insufficient amount", async () => {
        const user1 = {
            name: "Peter Murray",
            email: "ah@des.km",
            password: "admin",
        };

        const user2 = {
            name: "Ralph Horton",
            email: "kuhagbot@dagosi.co",
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

        await expect(
            createStatementUseCase.execute({
                user_id: login1.user.id as string,
                type: OperationType.TRANSFER,
                amount: 15,
                description: "Description Test",
                receiver_id: login2.user.id as string,
            })
        ).rejects.toEqual(new CreateStatementError.InsufficientFunds);
    });

    it("should not be able to create a transfer statement with invalid sender user", async () => {
        const user1 = {
            name: "Peter Murray",
            email: "wakuneh@sitcor.jp",
            password: "admin",
        };
        
        await createUserUseCase.execute(user1);

        const login1 = await authenticateUserUseCase.execute({
            email: user1.email,
            password: user1.password
        });

        await createStatementUseCase.execute({
            user_id: login1.user.id as string,
            type: OperationType.DEPOSIT,
            amount: 10,
            description: "Description Test"
        });

        await expect(
            createStatementUseCase.execute({
                user_id: login1.user.id as string,
                type: OperationType.TRANSFER,
                amount: 10,
                description: "Description Test",
                receiver_id: "test",
            })
        ).rejects.toEqual(new CreateStatementError.UserNotFound);
    });
})