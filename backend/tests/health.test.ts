import request from "supertest";
import app from "../src/app";

describe("Health API", () => {
  it("should return API health status", async () => {
    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe(
      "Social Media Platform API is running!"
    );
  });

  it("should expose the OpenAPI document for all registered API routes", async () => {
    const response = await request(app).get("/api-docs.json");

    expect(response.status).toBe(200);
    expect(response.body.openapi).toBe("3.0.3");
    expect(Object.keys(response.body.paths)).toEqual(
      expect.arrayContaining([
        "/",
        "/api/health",
        "/api/auth/register",
        "/api/auth/login",
        "/api/auth/forgot-password",
        "/api/auth/reset-password",
        "/api/auth/logout",
        "/api/auth/me",
        "/api/users/profile",
        "/api/users/roles",
        "/api/users/profile/photo",
      ])
    );
    expect(response.body.paths["/api/auth/register"].post.responses["403"]).toBeDefined();
    expect(response.body.components.schemas.RegisterRequest.required).toEqual(
      expect.arrayContaining(["dateOfBirth", "termsAccepted"])
    );
    expect(response.body.components.securitySchemes.cookieAuth.name).toBe(
      "social_access_token"
    );
  });

  it("should serve Swagger UI", async () => {
    const response = await request(app).get("/api-docs/");

    expect(response.status).toBe(200);
    expect(response.text).toContain("Swagger UI");
  });
});