import request from "supertest";
import { Connection } from "typeorm";
import { v4 as uuid } from "uuid";
import { app } from "../../../../app";

import createConnection from "../../../../database";

let connection: Connection;



describe("Create a statement", () => {
    beforeAll(async () => {
        connection = await createConnection();
        await connection.runMigrations();
    });

    afterAll(async () => {
        await connection.dropDatabase();
        await connection.close();
    });
    
    it("should create a deposit statement", async () => {
        const user = {
            name: "Pauline Myers",
            email: "rasmiba@igigujvuv.cl",
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

        const balance = await request(app).post("/api/v1/statements/deposit").send({
            amount: 12,
            description: "Test"
        }).set({
            Authorization: `Bearer ${tokenUser.body.token}`
        });

        expect(balance.status).toBe(201);
        expect(balance.body).toHaveProperty("id");
        expect(balance.body).toHaveProperty("created_at");
        expect(balance.body).toHaveProperty("updated_at");
    });

    it("should create a withdraw statement", async () => {
        const user = {
            name: "Manuel Wilkins",
            email: "hasmevujo@fi.fo",
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

        await request(app).post("/api/v1/statements/deposit").send({
            amount: 12,
            description: "Test"
        }).set({
            Authorization: `Bearer ${tokenUser.body.token}`
        });

        const balance = await request(app).post("/api/v1/statements/withdraw").send({
            amount: 12,
            description: "Test"
        }).set({
            Authorization: `Bearer ${tokenUser.body.token}`
        });

        expect(balance.status).toBe(201);
        expect(balance.body).toHaveProperty("id");
        expect(balance.body).toHaveProperty("created_at");
        expect(balance.body).toHaveProperty("updated_at");
    });

    it("should create a transfer statement", async () => {
        const user1 = {
            name: "Amy Cruz",
            email: "bac@uju.hr",
            password: "admin",
        };
        
        const user2 = {
            name: "Cory Huff",
            email: "defzuje@ohmul.gd",
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

        const balance = await request(app).post(`/api/v1/statements/transfers/${tokenUser2.body.user.id}`).send({
            amount: 12,
            description: "Test"
        }).set({
            Authorization: `Bearer ${tokenUser1.body.token}`
        });

        expect(balance.status).toBe(201);
    });

    it("should not able to create a statement with insufficient funds", async () => {
        const user = {
            name: "Sue Porter",
            email: "poizo@la.ms",
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

        const balance = await request(app).post("/api/v1/statements/withdraw").send({
            amount: 1000,
            description: "Test"
        }).set({
            Authorization: `Bearer ${tokenUser.body.token}`
        });

        expect(balance.status).toBe(400);
        expect(balance.body).toHaveProperty("message");
        expect(balance.body.message).toEqual("Insufficient funds");
    });

    it("should not able to create a statement with a invalid user", async () => {
        const balance = await request(app).post("/api/v1/statements/withdraw").send({
            amount: 1000,
            description: "Test"
        }).set({
            Authorization: "Bearer 123"
        });

        expect(balance.status).toBe(401);
        expect(balance.body).toHaveProperty("message");
        expect(balance.body.message).toEqual("JWT invalid token!");
    });

    it("should not be able to transfer to the same sender", async () => {
        const user1 = {
            name: "Paul Wilson",
            email: "tafdu@wenel.yt",
            password: "admin",
        };
        
        await request(app).post("/api/v1/users").send(user1);

        const tokenUser1 = await request(app).post("/api/v1/sessions").send({
            email: user1.email,
            password: user1.password,
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

        const balance = await request(app).post(`/api/v1/statements/transfers/${tokenUser1.body.user.id}`).send({
            amount: 12,
            description: "Test"
        }).set({
            Authorization: `Bearer ${tokenUser1.body.token}`
        });

        expect(balance.status).toBe(400);
        expect(balance.body).toHaveProperty("message");
        expect(balance.body.message).toEqual("Operation not permitted");
    });

    it("should not be able to create a transfer statement with insufficient amount", async () => {
        const user1 = {
            name: "Sally Bryan",
            email: "kak@dafrece.ag",
            password: "admin",
        };
        
        const user2 = {
            name: "Christopher Barton",
            email: "loomeva@fuz.aq",
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
    
        const balance = await request(app).post(`/api/v1/statements/transfers/${tokenUser2.body.user.id}`).send({
            amount: 15,
            description: "Test"
        }).set({
            Authorization: `Bearer ${tokenUser1.body.token}`
        });

        expect(balance.status).toBe(400);
        expect(balance.body).toHaveProperty("message");
        expect(balance.body.message).toEqual("Insufficient funds");
    });

    it("should not be able to create a transfer statement with invalid sender user", async () => {
        const user1 = {
            name: "Adrian Hogan",
            email: "jeg@vu.er",
            password: "admin",
        };

        await request(app).post("/api/v1/users").send(user1);
    
        const tokenUser1 = await request(app).post("/api/v1/sessions").send({
            email: user1.email,
            password: user1.password,
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
    
        const balance = await request(app).post("/api/v1/statements/transfers/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx").send({
            amount: 12,
            description: "Test"
        }).set({
            Authorization: `Bearer ${tokenUser1.body.token}`
        });

        expect(balance.status).toBe(500);
        expect(balance.body).toHaveProperty("message");
        expect(balance.body).toHaveProperty("status");
        expect(balance.body.message).toEqual('Internal server error - invalid input syntax for type uuid: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" ');
    });
})
