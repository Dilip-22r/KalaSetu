import { create } from "zustand";
import axios from "axios";
import API from "../utils/api";

export const useFeedStore = create((set, get) => ({
  posts: [],
  page: 1,
  hasMore: false,
  category: "",
  search: "",
  loading: false,
  loadingMore: false,
  lastFetchedAt: null,

  setCategory: (category) => {
    if (get().category !== category) {
      set({ category, page: 1, posts: [], hasMore: false, lastFetchedAt: null });
    }
  },

  setSearch: (search) => {
    if (get().search !== search) {
      set({ search, page: 1, posts: [], hasMore: false, lastFetchedAt: null });
    }
  },

  fetchPosts: async (pageNum = 1, append = false, forceRefresh = false) => {
    const state = get();
    
    // Cache for 2 minutes unless forced
    if (!forceRefresh && !append && pageNum === 1 && state.posts.length > 0 && state.lastFetchedAt) {
      const now = Date.now();
      if (now - state.lastFetchedAt < 2 * 60 * 1000) {
        return; // Use cached posts
      }
    }

    if (append) set({ loadingMore: true });
    else set({ loading: true });

    try {
      const params = { page: pageNum, limit: 10 };
      if (state.search) params.search = state.search;
      if (state.category) params.category = state.category;
      
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const res = await axios.get(`${API}/posts`, { params, headers });
      const { posts: newPosts, hasMore: more } = res.data;
      
      set((prev) => ({
        posts: append ? [...prev.posts, ...newPosts] : newPosts,
        hasMore: more,
        page: pageNum,
        lastFetchedAt: Date.now(),
      }));
    } catch {
      if (!append) set({ posts: [] });
    } finally {
      if (append) set({ loadingMore: false });
      else set({ loading: false });
    }
  },

  // Helpers to optimistically update individual posts directly in the cache
  updatePostLikes: (postId, likes, dislikes) => set((state) => ({
    posts: state.posts.map(p => p._id === postId ? { ...p, likes, dislikes } : p)
  })),

  updatePostReposts: (postId, reposts) => set((state) => ({
    posts: state.posts.map(p => p._id === postId ? { ...p, reposts } : p)
  })),

  deletePost: (postId) => set((state) => ({
    posts: state.posts.filter(p => p._id !== postId)
  }))
}));
