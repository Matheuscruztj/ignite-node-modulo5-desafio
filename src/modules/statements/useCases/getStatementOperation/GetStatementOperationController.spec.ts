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

describe("Get a statement", () => {
    beforeAll(async () => {
        connection = await createConnection();
        await connection.runMigrations();

        await request(app).post("/api/v1/users").send(user);
    });

    afterAll(async () => {
        await connection.dropDatabase();
        await connection.close();
    });

    it("should be able to get a deposit statement", async () => {
        const tokenUser = await request(app).post("/api/v1/sessions").send({
            email: user.email,
            password: user.password,
        }).set({
            Accept: "application/json",
            ContentType: "application/json",
        });

        const statement = await request(app).post("/api/v1/statements/deposit").send({
            amount: 12,
            description: "Test"
        }).set({
            Authorization: `Bearer ${tokenUser.body.token}`
        });

        const checkStatement = await request(app).get(`/api/v1/statements/${statement.body.id}`).set({
            Authorization: `Bearer ${tokenUser.body.token}`
        });

        expect(checkStatement.status).toBe(200);
        expect(checkStatement.body).toHaveProperty("id");
    });

    it("should be able to get a deposit statement", async () => {
        const tokenUser = await request(app).post("/api/v1/sessions").send({
            email: user.email,
            password: user.password,
        }).set({
            Accept: "application/json",
            ContentType: "application/json",
        });

        await request(app).post("/api/v1/statements/deposit").send({
            amount: 12,
            description: "Test"
        }).set({
            Authorization: `Bearer ${tokenUser.body.token}`
        });

        const statement = await request(app).post("/api/v1/statements/withdraw").send({
            amount: 12,
            description: "Test"
        }).set({
            Authorization: `Bearer ${tokenUser.body.token}`
        });

        const checkStatement = await request(app).get(`/api/v1/statements/${statement.body.id}`).set({
            Authorization: `Bearer ${tokenUser.body.token}`
        });

        expect(checkStatement.status).toBe(200);
        expect(checkStatement.body).toHaveProperty("id");
    });

    it("should not be able to get a statement with an invalid user", async () => {
        const checkStatement = await request(app).get("/api/v1/statements/123").set({
            Authorization: "Bearer 123"
        });

        expect(checkStatement.status).toBe(401);
        expect(checkStatement.body).toHaveProperty("message");
        expect(checkStatement.body.message).toEqual("JWT invalid token!");
    });

    it("should not be able to get a statement with an invalid statement", async () => {
        const tokenUser = await request(app).post("/api/v1/sessions").send({
            email: user.email,
            password: user.password,
        }).set({
            Accept: "application/json",
            ContentType: "application/json",
        });

        const checkStatement = await request(app).get("/api/v1/statements/123").set({
            Authorization: `Bearer ${tokenUser.body.token}`
        });

        expect(checkStatement.status).toBe(500);
        expect(checkStatement.body).toHaveProperty("message");
        expect(checkStatement.body.message).toEqual('Internal server error - invalid input syntax for type uuid: "123" ');
    });
});