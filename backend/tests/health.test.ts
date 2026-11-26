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
        "/api/posts",
        "/api/posts/explore",
      ])
    );
    expect(response.body.paths["/api/auth/register"].post.responses["403"]).toBeDefined();
    expect(response.body.components.securitySchemes.bearerAuth).toMatchObject({
      type: "http",
      scheme: "bearer",
      bearerFormat: "JWT",
    });
    expect(
      response.body.paths["/api/auth/me"].get.security
    ).toEqual(expect.arrayContaining([expect.objectContaining({ bearerAuth: [] })]));
    expect(
      response.body.components.schemas.AuthResponse.properties.data.properties
        .token
    ).toBeDefined();
    expect(response.body.components.schemas.ForgotPasswordRequest.required).toEqual([
      "email",
    ]);
    expect(
      response.body.paths["/api/auth/forgot-password"].post.responses["429"]
    ).toBeDefined();
    expect(
      response.body.paths["/api/auth/reset-password"].post.responses["500"]
    ).toBeDefined();
    expect(response.body.paths["/api/posts"].post.requestBody.content[
      "multipart/form-data"
    ].schema.required).toEqual(["media", "title"]);
    expect(response.body.components.schemas.Post.properties.mediaType.enum).toEqual(
      ["image", "video"]
    );
    expect(
      response.body.paths["/api/posts/explore"].get.parameters[0].schema
    ).toMatchObject({ minimum: 1, maximum: 50, default: 20 });
    expect(
      response.body.components.schemas.ExplorePostsResponse.properties.data
        .properties.nextCursor.nullable
    ).toBe(true);
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