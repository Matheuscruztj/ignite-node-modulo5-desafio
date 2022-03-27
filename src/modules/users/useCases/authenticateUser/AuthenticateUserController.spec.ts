import { hash } from "bcryptjs";
import request from "supertest";
import { Connection } from "typeorm";
import { v4 as uuid } from "uuid";
import { app } from "../../../../app";

import createConnection from "../../../../database";

let connection: Connection;

const user = {
    name: "test",
    email: "test@example.com",
    password: "admin",
};

describe("Authenticate a user controller", () => {
    beforeAll(async () => {
        connection = await createConnection();
        await connection.runMigrations();

        await request(app).post("/api/v1/users").send(user);
    });

    afterAll(async () => {
        await connection.dropDatabase();
        await connection.close();
    });

    it("should be able to authenticate a user", async () => {
        const response = await request(app).post("/api/v1/sessions").send({
            email: user.email,
            password: user.password,
        }).set({
            Accept: "application/json",
            ContentType: "application/json",
        });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("user");
        expect(response.body).toHaveProperty("token");
        expect(response.body.user).toHaveProperty("id");
    });

    it("should not to be able to authenticate a user with a invalid email", async () => {
        const response = await request(app).post("/api/v1/sessions").send({
            email: "another@example.com",
            password: user.password,
        });

        expect(response.status).toBe(401);
        expect(response.body.message).toEqual("Incorrect email or password");
    });

    it("should not to be able to authenticate a user with a invalid password", async () => {
        const response = await request(app).post("/api/v1/sessions").send({
            email: user.email,
            password: "1",
        });

        expect(response.status).toBe(401);
        expect(response.body.message).toEqual("Incorrect email or password");
    });
})