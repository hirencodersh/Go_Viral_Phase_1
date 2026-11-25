import fs from "fs";
import path from "path";
import request from "supertest";
import app from "../src/app";

const uploadDirectory = path.resolve(process.env.UPLOAD_DIR || "uploads");
const testImageName = `cors-test-${process.pid}-${Date.now()}.png`;
const testImagePath = path.join(uploadDirectory, testImageName);

describe("Uploaded image delivery", () => {
  beforeAll(() => {
    fs.mkdirSync(uploadDirectory, { recursive: true });
    fs.writeFileSync(testImagePath, Buffer.from("test image"));
  });

  afterAll(() => {
    if (fs.existsSync(testImagePath)) fs.unlinkSync(testImagePath);
  });

  it("allows profile photos to be embedded from the frontend origin", async () => {
    const response = await request(app).get(`/uploads/${testImageName}`);
    expect(response.status).toBe(200);
    expect(response.headers["cross-origin-resource-policy"]).toBe("cross-origin");
  });
});
