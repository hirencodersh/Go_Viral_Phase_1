import { authService } from "../src/services/auth.service";
import { User } from "../src/models/User";
import { AGE_RESTRICTION_MESSAGE } from "../src/utils/age";

jest.mock("../src/models/User", () => ({
  User: {
    findOne: jest.fn(),
    create: jest.fn(),
  },
}));

describe("Registration age enforcement", () => {
  it("rejects under-18 registration before querying or creating a user", async () => {
    const today = new Date();
    const birthDate = `${today.getUTCFullYear() - 17}-${String(today.getUTCMonth() + 1).padStart(2, "0")}-${String(today.getUTCDate()).padStart(2, "0")}`;

    await expect(
      authService.register({
        fullName: "Taylor Sample",
        username: "taylor.sample",
        email: "taylor@example.com",
        dateOfBirth: birthDate,
        password: "A-strong-password1",
        confirmPassword: "A-strong-password1",
        termsAccepted: true,
      })
    ).rejects.toMatchObject({
      statusCode: 403,
      message: AGE_RESTRICTION_MESSAGE,
    });

    expect(User.findOne).not.toHaveBeenCalled();
    expect(User.create).not.toHaveBeenCalled();
  });
});
