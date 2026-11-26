import { apiClient } from "../../services/apiClient";

export interface PostAuthor {
  id: string;
  username: string;
  fullName: string;
  profilePhoto: string;
}

export interface Post {
  id: string;
  title: string;
  caption: string;
  mediaUrl: string;
  mediaType: "image" | "video";
  createdAt: string;
  author: PostAuthor;
}

export interface ExploreFeedPage {
  posts: Post[];
  nextCursor: string | null;
}

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export const postsApi = {
  async getFeed(signal?: AbortSignal): Promise<Post[]> {
    const response = await apiClient.get<ApiEnvelope<Post[]>>("/posts", {
      signal,
    });
    return response.data.data;
  },

  async getExploreFeed(
    cursor?: string,
    signal?: AbortSignal
  ): Promise<ExploreFeedPage> {
    const response = await apiClient.get<ApiEnvelope<ExploreFeedPage>>(
      "/posts/explore",
      {
        params: { cursor, limit: 20 },
        signal,
      }
    );
    return response.data.data;
  },

  async createPost(
    input: { media: File; title: string; caption: string },
    onProgress?: (progress: number) => void
  ): Promise<Post> {
    const formData = new FormData();
    formData.append("media", input.media);
    formData.append("title", input.title);
    formData.append("caption", input.caption);

    const response = await apiClient.post<ApiEnvelope<Post>>(
      "/posts",
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (event) => {
          if (event.total) {
            onProgress?.(Math.round((event.loaded / event.total) * 100));
          }
        },
      }
    );
    return response.data.data;
  },
};
