import { Test } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../src/app.module";

describe("Auth (e2e)", () => {
    let app: INestApplication;
    const testEmail = `e2e-${Date.now()}@example.com`;
    const testPassword = "password123";

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleRef.createNestApplication();
        app.useGlobalPipes(
            new ValidationPipe({ whitelist: true, transform: true }),
        );
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    it("/health (GET) returns ok", () => {
        return request(app.getHttpServer())
            .get("/health")
            .expect(200)
            .expect((res) => {
                expect(res.body.status).toBe("ok");
            });
    });

    it("/auth/register (POST) creates a user and returns a token", () => {
        return request(app.getHttpServer())
            .post("/auth/register")
            .send({
                email: testEmail,
                password: testPassword,
                name: "E2E Test User",
            })
            .expect(201)
            .expect((res) => {
                expect(res.body.accessToken).toBeDefined();
            });
    });

    it("/auth/register (POST) rejects a duplicate email", () => {
        return request(app.getHttpServer())
            .post("/auth/register")
            .send({
                email: testEmail,
                password: testPassword,
                name: "Duplicate",
            })
            .expect(409);
    });

    it("/auth/login (POST) succeeds with correct credentials", () => {
        return request(app.getHttpServer())
            .post("/auth/login")
            .send({ email: testEmail, password: testPassword })
            .expect(201)
            .expect((res) => {
                expect(res.body.accessToken).toBeDefined();
            });
    });

    it("/auth/login (POST) rejects wrong password", () => {
        return request(app.getHttpServer())
            .post("/auth/login")
            .send({ email: testEmail, password: "wrong-password" })
            .expect(401);
    });

    it("/auth/register (POST) rejects an invalid email", () => {
        return request(app.getHttpServer())
            .post("/auth/register")
            .send({
                email: "not-an-email",
                password: testPassword,
                name: "Bad Email",
            })
            .expect(400);
    });

    it("users/me (GET) rejects requests with no token", () => {
        return request(app.getHttpServer()).get("/users/me").expect(401);
    });

    it("users/me (GET) returns the current user with a valid token", async () => {
        const LoginRes = await request(app.getHttpServer())
            .post("/auth/login")
            .send({ email: testEmail, password: testPassword });

        const token = LoginRes.body.accessToken;

        return request(app.getHttpServer())
            .get("/users/me")
            .set("Authorization", `Bearer ${token}`)
            .expect(200)
            .expect((res) => {
                expect(res.body.email).toBe(testEmail);
                expect(res.body.passwordHash).toBeUndefined();
            });
    });
});
