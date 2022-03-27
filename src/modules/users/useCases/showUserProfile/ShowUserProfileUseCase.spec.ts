import { InMemoryUsersRepository } from "@modules/users/repositories/in-memory/InMemoryUsersRepository";
import { CreateUserUseCase } from "../createUser/CreateUserUseCase";
import { ShowUserProfileError } from "./ShowUserProfileError";
import { ShowUserProfileUseCase } from "./ShowUserProfileUseCase";

let inMemoryUsersRepository: InMemoryUsersRepository;
let showUserProfileUseCase: ShowUserProfileUseCase;
let createUserUseCase: CreateUserUseCase;

describe("Show user profile" , () => {
    beforeEach(() => {
        inMemoryUsersRepository = new InMemoryUsersRepository();
        showUserProfileUseCase = new ShowUserProfileUseCase(inMemoryUsersRepository);
        createUserUseCase = new CreateUserUseCase(inMemoryUsersRepository);
    });

    it("should be able to show user profile", async () => {
        const user = await createUserUseCase.execute({
            name: "test",
            email: "test@example.com",
            password: "admin",
        });

        const user_id = user.id as string;

        const userProfile = await showUserProfileUseCase.execute(user_id);

        expect(userProfile).toHaveProperty("id");
    })

    it("should not be able to show user profile of a non existent user", async () => {
        await expect( async () => {
            const user_id = "1";
    
            const user = await showUserProfileUseCase.execute(user_id);

        }).rejects.toBeInstanceOf(ShowUserProfileError);
    });
})