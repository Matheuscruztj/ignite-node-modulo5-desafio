import { hash } from "bcryptjs";
import request from "supertest";
import { Connection } from "typeorm";
import { v4 as uuid } from "uuid";
import { app } from "../../../../app";

import createConnection from "../../../../database";

let connection: Connection;

describe("Show user profile" , () => {
    beforeAll(async () => {
        connection = await createConnection();
        await connection.runMigrations();
    });

    afterAll(async () => {
        await connection.dropDatabase();
        await connection.close();
    });

    it("should be able to show user profile", async () => {
        const user = {
            name: "test",
            email: "test@example.com",
            password: "admin",
        };

        const createdUser = await request(app).post("/api/v1/users").send(user);
        
        const loggedUser = await request(app).post("/api/v1/sessions").send({
            email: user.email,
            password: user.password,
        }).set({
            Accept: "application/json",
            ContentType: "application/json",
        });

        const response = await request(app).get("/api/v1/profile").set({
            Authorization: `Bearer ${loggedUser.body.token}`
        });

        expect(response.status).toBe(200);
    });

    it("should not be able to show user profile of an invalid token", async () => {
        const invalidToken = "1";

        const response = await request(app).get("/api/v1/profile/").set({
            Authorization: `Bearer ${invalidToken}`
        });

        expect(response.status).toBe(401);
        expect(response.body.message).toEqual("JWT invalid token!");
    });
})