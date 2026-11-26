import { Types } from "mongoose";
import { Post } from "../src/models/Post";
import { postService } from "../src/services/post.service";

jest.mock("../src/models/Post", () => ({
  Post: {
    find: jest.fn(),
  },
}));

const findPosts = jest.mocked(Post.find);
const authorId = "507f1f77bcf86cd799439011";

const makeRecord = (id: string, createdAt: string) => ({
  _id: new Types.ObjectId(id),
  author: {
    _id: new Types.ObjectId(authorId),
    profile: {
      username: "taylor.sample",
      fullName: "Taylor Sample",
      profilePhoto: "",
    },
  },
  title: "Test post",
  caption: "",
  mediaUrl: "/uploads/test.png",
  mediaType: "image" as const,
  createdAt: new Date(createdAt),
});

const mockFindResult = (records: ReturnType<typeof makeRecord>[]) => {
  const populate = jest.fn().mockResolvedValue(records);
  const limit = jest.fn().mockReturnValue({ populate });
  const sort = jest.fn().mockReturnValue({ limit });
  findPosts.mockReturnValue({ sort } as never);
  return { sort, limit };
};

describe("postService.getExploreFeed", () => {
  beforeEach(() => {
    findPosts.mockReset();
  });

  it("uses a stable newest-first cursor and returns another page when available", async () => {
    const records = [
      makeRecord("607f1f77bcf86cd799439011", "2026-11-27T06:00:00.000Z"),
      makeRecord("607f1f77bcf86cd799439012", "2026-11-26T06:00:00.000Z"),
      makeRecord("607f1f77bcf86cd799439013", "2026-11-25T06:00:00.000Z"),
    ];
    const query = mockFindResult(records);

    const page = await postService.getExploreFeed(2);

    expect(findPosts).toHaveBeenCalledWith({});
    expect(query.sort).toHaveBeenCalledWith({ createdAt: -1, _id: -1 });
    expect(query.limit).toHaveBeenCalledWith(3);
    expect(page.posts.map((post) => post.id)).toEqual([
      "607f1f77bcf86cd799439011",
      "607f1f77bcf86cd799439012",
    ]);
    expect(JSON.parse(Buffer.from(page.nextCursor!, "base64url").toString())).toEqual({
      id: "607f1f77bcf86cd799439012",
      createdAt: "2026-11-26T06:00:00.000Z",
    });
  });

  it("uses the cursor as a strict continuation and returns no cursor at the end", async () => {
    const cursorId = "607f1f77bcf86cd799439012";
    const cursorDate = "2026-11-26T06:00:00.000Z";
    const cursor = Buffer.from(
      JSON.stringify({ id: cursorId, createdAt: cursorDate })
    ).toString("base64url");
    mockFindResult([]);

    const page = await postService.getExploreFeed(20, cursor);

    expect(findPosts).toHaveBeenCalledWith({
      $or: [
        { createdAt: { $lt: new Date(cursorDate) } },
        {
          createdAt: new Date(cursorDate),
          _id: { $lt: new Types.ObjectId(cursorId) },
        },
      ],
    });
    expect(page).toEqual({ posts: [], nextCursor: null });
  });

  it("rejects malformed cursors before querying MongoDB", async () => {
    await expect(postService.getExploreFeed(20, "invalid-cursor")).rejects
      .toMatchObject({ statusCode: 400, message: "Invalid post feed cursor" });

    expect(findPosts).not.toHaveBeenCalled();
  });
});
