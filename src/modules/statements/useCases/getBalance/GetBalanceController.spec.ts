import { hash } from "bcryptjs";
import request from "supertest";
import { Connection } from "typeorm";
import { v4 as uuid } from "uuid";
import { app } from "../../../../app";

import createConnection from "../../../../database";

let connection: Connection;

describe("Get User Balance Controller", () => {
    beforeAll(async () => {
        connection = await createConnection();
        await connection.runMigrations();
    });

    afterAll(async () => {
        await connection.dropDatabase();
        await connection.close();
    });

    it("should be able to get user balance", async () => {
        const user = {
            name: "Gilbert Hall",
            email: "logice@ligkafew.io",
            password: "admin",
        };

        await request(app).post("/api/v1/users").send(user);

        const tokenUser = await request(app).post("/api/v1/sessions").send({
            email: user.email,
            password: user.password,
        }).set({
            Accept: "application/json",
            ContentType: "application/json",
        });

        const balance = await request(app).get("/api/v1/statements/balance").set({
            Authorization: `Bearer ${tokenUser.body.token}`
        });

        expect(balance.status).toBe(200);
        expect(balance.body).toHaveProperty("statement");
        expect(balance.body).toHaveProperty("balance");
    });

    it("should not to be able to get user balance", async () => {
        const balance = await request(app).get("/api/v1/statements/balance").set({
            Authorization: "Bearer 1"
        });

        expect(balance.status).toBe(401);
        expect(balance.body).toHaveProperty("message");
        expect(balance.body.message).toEqual("JWT invalid token!");
    });

    it("should be able to get the user balance after transfer received", async () => {
        const user1 = {
            name: "Lucile Shelton",
            email: "sog@kespasa.nl",
            password: "admin",
        };
        
        const user2 = {
            name: "James Alvarez",
            email: "busu@ocubog.bh",
            password: "admin",
        };
    
        await request(app).post("/api/v1/users").send(user1);
        await request(app).post("/api/v1/users").send(user2);
    
        const tokenUser1 = await request(app).post("/api/v1/sessions").send({
            email: user1.email,
            password: user1.password,
        }).set({
            Accept: "application/json",
            ContentType: "application/json",
        });
    
        const tokenUser2 = await request(app).post("/api/v1/sessions").send({
            email: user2.email,
            password: user2.password,
        }).set({
            Accept: "application/json",
            ContentType: "application/json",
        });
    
        await request(app).post("/api/v1/statements/deposit").send({
            amount: 12,
            description: "Test"
        }).set({
            Authorization: `Bearer ${tokenUser1.body.token}`
        });
    
        await request(app).post(`/api/v1/statements/transfers/${tokenUser2.body.user.id}`).send({
            amount: 12,
            description: "Test"
        }).set({
            Authorization: `Bearer ${tokenUser1.body.token}`
        });

        const balance = await request(app).get("/api/v1/statements/balance").set({
            Authorization: `Bearer ${tokenUser2.body.token}`
        });

        expect(balance.status).toBe(200);
        expect(balance.body).toHaveProperty("statement");
        expect(balance.body).toHaveProperty("balance");
        expect(balance.body.balance).toBe(12);
    });
});