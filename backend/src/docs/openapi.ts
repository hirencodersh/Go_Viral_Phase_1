export const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "Social Media Platform API",
    version: "1.0.0",
    description:
      "REST API for the Socially application. Register and login return a JWT for `Authorization: Bearer <token>` and also set an HttpOnly `social_access_token` cookie for browser sessions.",
  },
  servers: [
    {
      url: "/",
      description: "Current host",
    },
  ],
  tags: [
    { name: "System", description: "Service status and health" },
    { name: "Authentication", description: "Account and session endpoints" },
    { name: "Profiles", description: "User profile and account role management" },
    { name: "Posts", description: "Create photo and video posts and view the feed" },
  ],
  paths: {
    "/": {
      get: {
        tags: ["System"],
        summary: "Get API welcome message",
        responses: {
          "200": {
            description: "API welcome message",
            content: {
              "text/html": {
                schema: { type: "string" },
                example: "Welcome to Social Media Platform API",
              },
            },
          },
        },
      },
    },
    "/api/health": {
      get: {
        tags: ["System"],
        summary: "Check API health",
        responses: {
          "200": {
            description: "API is running",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/HealthResponse" },
                example: {
                  success: true,
                  message: "Social Media Platform API is running!",
                  timestamp: "2026-11-25T06:30:00.000Z",
                },
              },
            },
          },
        },
      },
    },
    "/api/auth/register": {
      post: {
        tags: ["Authentication"],
        summary: "Register an account",
        description:
          "Creates an account, returns a JWT access token, and sets the HttpOnly authentication cookie.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RegisterRequest" },
              example: {
                fullName: "Taylor Sample",
                username: "taylor.sample",
                email: "taylor@example.com",
                dateOfBirth: "1990-05-12",
                password: "StrongPassword1!",
                confirmPassword: "StrongPassword1!",
                termsAccepted: true,
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Account created and session cookie set",
            headers: {
              "Set-Cookie": {
                description:
                  "HttpOnly session cookie for browser clients. The response body also contains a JWT for Bearer authentication.",
                schema: { type: "string" },
              },
            },
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthResponse" },
              },
            },
          },
          "400": { $ref: "#/components/responses/ValidationError" },
          "403": { $ref: "#/components/responses/AgeRestrictionError" },
          "409": { $ref: "#/components/responses/ConflictError" },
          "413": { $ref: "#/components/responses/PayloadTooLarge" },
          "429": { $ref: "#/components/responses/RateLimitError" },
          "500": { $ref: "#/components/responses/ServerError" },
        },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["Authentication"],
        summary: "Log in",
        description:
          "Verifies credentials, returns a JWT access token, and sets the HttpOnly authentication cookie. Setting `rememberMe` to true extends the session to 30 days; otherwise it is a browser-session cookie.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" },
              example: {
                email: "taylor@example.com",
                password: "StrongPassword1!",
                rememberMe: false,
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Login successful and session cookie set",
            headers: {
              "Set-Cookie": {
                description:
                  "HttpOnly session cookie for browser clients. The response body also contains a JWT for Bearer authentication.",
                schema: { type: "string" },
              },
            },
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthResponse" },
              },
            },
          },
          "400": { $ref: "#/components/responses/ValidationError" },
          "401": { $ref: "#/components/responses/UnauthorizedError" },
          "403": { $ref: "#/components/responses/AgeRestrictionError" },
          "413": { $ref: "#/components/responses/PayloadTooLarge" },
          "429": { $ref: "#/components/responses/RateLimitError" },
          "500": { $ref: "#/components/responses/ServerError" },
        },
      },
    },
    "/api/auth/forgot-password": {
      post: {
        tags: ["Authentication"],
        summary: "Request a password reset email",
        description:
          "Requests a short-lived reset link. A generic accepted response is returned for unknown email addresses; SMTP configuration and connection failures use a generic service-unavailable response.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ForgotPasswordRequest" },
              example: { email: "taylor@example.com" },
            },
          },
        },
        responses: {
          "202": {
            description: "Reset request accepted",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/PasswordResetResponse" },
              },
            },
          },
          "400": { $ref: "#/components/responses/ValidationError" },
          "429": { $ref: "#/components/responses/RateLimitError" },
          "503": { $ref: "#/components/responses/ServiceUnavailableError" },
          "500": { $ref: "#/components/responses/ServerError" },
        },
      },
    },
    "/api/auth/reset-password": {
      post: {
        tags: ["Authentication"],
        summary: "Reset a password with an emailed token",
        description:
          "The reset token is single-use and expires after 15 minutes. Passwords must be at least 8 characters and no more than 72 UTF-8 bytes.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ResetPasswordRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Password changed successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/PasswordResetResponse" },
              },
            },
          },
          "400": {
            description: "Invalid or expired reset token, or validation failure",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "429": { $ref: "#/components/responses/RateLimitError" },
          "500": { $ref: "#/components/responses/ServerError" },
        },
      },
    },
    "/api/auth/logout": {
      post: {
        tags: ["Authentication"],
        summary: "Log out",
        description:
          "Clears the browser's authentication cookie. Authentication is not required.",
        responses: {
          "200": {
            description: "Session cookie cleared",
            headers: {
              "Set-Cookie": {
                description: "Expires the `social_access_token` cookie.",
                schema: { type: "string" },
              },
            },
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LogoutResponse" },
                example: {
                  success: true,
                  message: "Logged out successfully",
                  data: null,
                },
              },
            },
          },
        },
      },
    },
    "/api/auth/me": {
      get: {
        tags: ["Authentication"],
        summary: "Get the current authenticated user",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: {
          "200": {
            description: "Authenticated user's public profile",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CurrentUserResponse" },
              },
            },
          },
          "401": { $ref: "#/components/responses/UnauthorizedError" },
          "403": { $ref: "#/components/responses/AgeRestrictionError" },
          "500": { $ref: "#/components/responses/ServerError" },
        },
      },
    },
    "/api/users/profile": {
      get: {
        tags: ["Profiles"],
        summary: "Get logged-in user's profile",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: {
          "200": {
            description: "Profile fetched successfully",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ProfileResponse" } } },
          },
          "401": { $ref: "#/components/responses/UnauthorizedError" },
          "403": { $ref: "#/components/responses/AgeRestrictionError" },
          "500": { $ref: "#/components/responses/ServerError" },
        },
      },
      put: {
        tags: ["Profiles"],
        summary: "Update logged-in user's username and bio",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/ProfileUpdateRequest" } } },
        },
        responses: {
          "200": {
            description: "Profile updated successfully",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ProfileResponse" } } },
          },
          "400": { $ref: "#/components/responses/ValidationError" },
          "401": { $ref: "#/components/responses/UnauthorizedError" },
          "403": { $ref: "#/components/responses/AgeRestrictionError" },
          "409": { $ref: "#/components/responses/ConflictError" },
        },
      },
    },
    "/api/users/roles": {
      patch: {
        tags: ["Profiles"],
        summary: "Update logged-in user's account roles",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/RoleUpdateRequest" } } },
        },
        responses: {
          "200": {
            description: "Account type updated successfully",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ProfileResponse" } } },
          },
          "400": { $ref: "#/components/responses/ValidationError" },
          "401": { $ref: "#/components/responses/UnauthorizedError" },
          "403": { $ref: "#/components/responses/AgeRestrictionError" },
        },
      },
    },
    "/api/users/profile/photo": {
      post: {
        tags: ["Profiles"],
        summary: "Upload or replace profile photo",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["profilePhoto"],
                properties: { profilePhoto: { type: "string", format: "binary" } },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Profile photo uploaded successfully",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ProfileResponse" } } },
          },
          "400": { $ref: "#/components/responses/ValidationError" },
          "401": { $ref: "#/components/responses/UnauthorizedError" },
          "403": { $ref: "#/components/responses/AgeRestrictionError" },
          "413": { $ref: "#/components/responses/PayloadTooLarge" },
        },
      },
    },
    "/api/posts": {
      get: {
        tags: ["Posts"],
        summary: "Get the latest posts",
        description: "Returns up to 50 recent posts with their author details.",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: {
          "200": {
            description: "Post feed",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/PostFeedResponse" },
              },
            },
          },
          "401": { $ref: "#/components/responses/UnauthorizedError" },
        },
      },
      post: {
        tags: ["Posts"],
        summary: "Publish a photo or video post",
        description:
          "Fans and creators can publish a JPG, PNG, WebP, MP4, WebM, or MOV file up to 50 MB with a title and optional caption.",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["media", "title"],
                properties: {
                  media: { type: "string", format: "binary" },
                  title: { type: "string", minLength: 1, maxLength: 120 },
                  caption: { type: "string", maxLength: 1000 },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Post published",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/PostResponse" },
              },
            },
          },
          "400": { $ref: "#/components/responses/ValidationError" },
          "401": { $ref: "#/components/responses/UnauthorizedError" },
          "413": { $ref: "#/components/responses/PayloadTooLarge" },
        },
      },
    },
    "/api/posts/explore": {
      get: {
        tags: ["Posts"],
        summary: "Explore all users' posts",
        description:
          "Returns a cursor-paginated feed of image and video posts from all users.",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", minimum: 1, maximum: 50, default: 20 },
          },
          {
            name: "cursor",
            in: "query",
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Explore feed page",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ExplorePostsResponse" },
              },
            },
          },
          "400": { $ref: "#/components/responses/ValidationError" },
          "401": { $ref: "#/components/responses/UnauthorizedError" },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description:
          "Use the JWT returned by register or login as `Authorization: Bearer <token>`.",
      },
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "social_access_token",
        description:
          "Set by the register or login endpoints. The cookie is HttpOnly and cannot be entered manually in browser JavaScript.",
      },
    },
    schemas: {
      ProfileData: {
        type: "object",
        required: ["_id", "username", "email", "profilePhoto", "bio", "roles"],
        properties: {
          _id: { type: "string" },
          username: { type: "string" },
          email: { type: "string", format: "email" },
          profilePhoto: { type: "string" },
          bio: { type: "string", maxLength: 250 },
          roles: { type: "array", minItems: 1, uniqueItems: true, items: { type: "string", enum: ["fan", "creator"] } },
        },
      },
      ProfileResponse: {
        type: "object",
        required: ["success", "message", "data"],
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string" },
          data: { $ref: "#/components/schemas/ProfileData" },
        },
      },
      PostAuthor: {
        type: "object",
        required: ["id", "username", "fullName", "profilePhoto"],
        properties: {
          id: { type: "string" },
          username: { type: "string" },
          fullName: { type: "string" },
          profilePhoto: { type: "string" },
        },
      },
      Post: {
        type: "object",
        required: [
          "id",
          "title",
          "caption",
          "mediaUrl",
          "mediaType",
          "createdAt",
          "author",
        ],
        properties: {
          id: { type: "string" },
          title: { type: "string", maxLength: 120 },
          caption: { type: "string", maxLength: 1000 },
          mediaUrl: { type: "string", format: "uri" },
          mediaType: { type: "string", enum: ["image", "video"] },
          createdAt: { type: "string", format: "date-time" },
          author: { $ref: "#/components/schemas/PostAuthor" },
        },
      },
      PostFeedResponse: {
        type: "object",
        required: ["success", "message", "data"],
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string", example: "Posts fetched successfully" },
          data: {
            type: "array",
            items: { $ref: "#/components/schemas/Post" },
          },
        },
      },
      ExplorePostsResponse: {
        type: "object",
        required: ["success", "message", "data"],
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string", example: "Explore feed fetched successfully" },
          data: {
            type: "object",
            required: ["posts", "nextCursor"],
            properties: {
              posts: {
                type: "array",
                items: { $ref: "#/components/schemas/Post" },
              },
              nextCursor: { type: "string", nullable: true },
            },
          },
        },
      },
      PostResponse: {
        type: "object",
        required: ["success", "message", "data"],
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string", example: "Post published successfully" },
          data: { $ref: "#/components/schemas/Post" },
        },
      },
      ProfileUpdateRequest: {
        type: "object",
        required: ["username", "bio"],
        properties: {
          username: { type: "string", minLength: 3, maxLength: 30 },
          bio: { type: "string", maxLength: 250 },
        },
      },
      RoleUpdateRequest: {
        type: "object",
        required: ["roles"],
        properties: {
          roles: { type: "array", minItems: 1, uniqueItems: true, items: { type: "string", enum: ["fan", "creator"] } },
        },
      },
      PublicUser: {
        type: "object",
        required: ["id", "fullName", "username", "email"],
        properties: {
          id: { type: "string", example: "65f1a2b3c4d5e6f789012345" },
          fullName: { type: "string", example: "Taylor Sample" },
          username: { type: "string", example: "taylor.sample" },
          email: { type: "string", format: "email", example: "taylor@example.com" },
        },
      },
      RegisterRequest: {
        type: "object",
        required: [
          "fullName",
          "username",
          "email",
          "dateOfBirth",
          "password",
          "confirmPassword",
          "termsAccepted",
        ],
        properties: {
          fullName: { type: "string", minLength: 2, maxLength: 80 },
          username: {
            type: "string",
            minLength: 3,
            maxLength: 30,
            pattern: "^[a-z0-9](?:[a-z0-9._]{1,28}[a-z0-9])$",
            description: "Letters, numbers, dots, and underscores; normalized to lowercase.",
          },
          email: { type: "string", format: "email", maxLength: 254 },
          dateOfBirth: {
            type: "string",
            format: "date",
            description: "Date of birth in YYYY-MM-DD format; future dates and users under 18 are rejected.",
          },
          password: {
            type: "string",
            minLength: 8,
            description: "Maximum 72 UTF-8 bytes.",
            format: "password",
          },
          confirmPassword: { type: "string", format: "password" },
          termsAccepted: {
            type: "boolean",
            enum: [true],
            description: "Must be true to accept the current Terms and Conditions and Privacy Policy.",
          },
        },
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email", maxLength: 254 },
          password: {
            type: "string",
            minLength: 1,
            description: "Maximum 72 UTF-8 bytes.",
            format: "password",
          },
          rememberMe: {
            type: "boolean",
            default: false,
            description: "When true, keeps the session for up to 30 days.",
          },
        },
      },
      ForgotPasswordRequest: {
        type: "object",
        required: ["email"],
        properties: {
          email: { type: "string", format: "email", maxLength: 254 },
        },
      },
      ResetPasswordRequest: {
        type: "object",
        required: ["token", "password", "confirmPassword"],
        properties: {
          token: { type: "string", minLength: 32, maxLength: 128 },
          password: {
            type: "string",
            minLength: 8,
            description: "Maximum 72 UTF-8 bytes.",
            format: "password",
          },
          confirmPassword: { type: "string", format: "password" },
        },
      },
      PasswordResetResponse: {
        type: "object",
        required: ["success", "message", "data"],
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string" },
          data: { type: "object", nullable: true, example: null },
        },
      },
      HealthResponse: {
        type: "object",
        required: ["success", "message", "timestamp"],
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string" },
          timestamp: { type: "string", format: "date-time" },
        },
      },
      AuthResponse: {
        type: "object",
        required: ["success", "message", "data"],
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string", example: "Login successful" },
          data: {
            type: "object",
            required: ["user", "token"],
            properties: {
              user: { $ref: "#/components/schemas/PublicUser" },
              token: {
                type: "string",
                description:
                  "JWT access token. Send it as `Authorization: Bearer <token>` on protected requests.",
              },
            },
          },
        },
      },
      CurrentUserResponse: {
        type: "object",
        required: ["success", "message", "data"],
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string", example: "Authenticated user" },
          data: {
            type: "object",
            required: ["user"],
            properties: { user: { $ref: "#/components/schemas/PublicUser" } },
          },
        },
      },
      LogoutResponse: {
        type: "object",
        required: ["success", "message", "data"],
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string", example: "Logged out successfully" },
          data: { type: "object", nullable: true, example: null },
        },
      },
      ErrorResponse: {
        type: "object",
        required: ["success", "message"],
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string", example: "Invalid email or password" },
        },
      },
      ValidationErrorResponse: {
        type: "object",
        required: ["success", "message", "errors"],
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string", example: "Validation failed" },
          errors: {
            type: "array",
            items: {
              type: "object",
              required: ["field", "message"],
              properties: {
                field: { type: "string", example: "email" },
                message: { type: "string", example: "Invalid email" },
              },
            },
          },
        },
      },
    },
    responses: {
      ValidationError: {
        description: "Request body failed validation",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ValidationErrorResponse" },
          },
        },
      },
      ConflictError: {
        description: "Email address or username is already registered",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
          },
        },
      },
      UnauthorizedError: {
        description: "Missing, invalid, or expired authentication",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
          },
        },
      },
      AgeRestrictionError: {
        description: "Account creation or access is restricted to users aged 18 or older",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
            example: {
              success: false,
              message: "You must be at least 18 years old to use Socially.",
            },
          },
        },
      },
      PayloadTooLarge: {
        description: "Request body exceeds the 10 KB limit",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
          },
        },
      },
      RateLimitError: {
        description: "Too many authentication or password reset requests",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
          },
        },
      },
      ServerError: {
        description: "Unexpected server error",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
          },
        },
      },
      ServiceUnavailableError: {
        description: "Password reset email is not configured or could not be delivered",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
          },
        },
      },
    },
  },
} as const;
