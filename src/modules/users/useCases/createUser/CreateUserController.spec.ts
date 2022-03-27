import { hash } from "bcryptjs";
import request from "supertest";
import { Connection } from "typeorm";
import { v4 as uuid } from "uuid";
import { app } from "../../../../app";

import createConnection from "../../../../database";
import { CreateUserError } from "./CreateUserError";

let connection: Connection;

describe("Create User Controller", () => {
  beforeAll(async () => {
    connection = await createConnection();
    await connection.runMigrations();
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });

  it("should be able to create a new user", async () => {
    const response = await request(app).post("/api/v1/users").send({
      name: "test",
      email: "test@example.com",
      password: "admin",
    });

    expect(response.status).toBe(201);
  });

  it("should not be able to register a new user when email already exists", async () => {
      await request(app).post("/api/v1/users").send({
        name: "test",
        email: "test@example.com",
        password: "admin",
      });

      const response = await request(app).post("/api/v1/users").send({
        name: "test",
        email: "test@example.com",
        password: "admin",
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toEqual("User already exists");
  });
});
