import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { supabase } from '../../lib/supabaseClient'
import type { Post } from '../../types/post'

interface BlogsState {
  posts: Post[]
  currentPost: Post | null
  loading: boolean
  loadingSingle: boolean
  error: string | null
  totalCount: number
}

const initialState: BlogsState = {
  posts: [],
  currentPost: null,
  loading: false,
  loadingSingle: false,
  error: null,
  totalCount: 0,
}

const PAGE_SIZE = 10

export const fetchPosts = createAsyncThunk(
  'blogs/fetchPosts',
  async (page: number = 0) => {
    const from = page * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    const [{ data: posts, count, error: postsError }] = await Promise.all([
      supabase
        .from('posts')
        .select('id, title, content, created_at, author_email, user_id', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to),
    ])

    if (postsError) throw postsError

    return { posts: posts as Post[], totalCount: count ?? 0 }
  }
)

export const fetchPost = createAsyncThunk('blogs/fetchPost', async (id: string) => {
  const { data, error } = await supabase
    .from('posts')
    .select('id, title, content, created_at, author_email, user_id')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as Post
})

export const createPost = createAsyncThunk(
  'blogs/createPost',
  async ({ title, content, author_email }: { title: string; content: string; author_email: string }) => {
    const { data, error } = await supabase
      .from('posts')
      .insert({ title, content, author_email })
      .select()
      .single()
    if (error) throw error
    return data as Post
  }
)

export const updatePost = createAsyncThunk(
  'blogs/updatePost',
  async ({ id, title, content, author_email }: { id: string; title: string; content: string; author_email: string }) => {
    const { data, error } = await supabase
      .from('posts')
      .update({ title, content, author_email })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as Post
  }
)

export const deletePost = createAsyncThunk('blogs/deletePost', async (id: string) => {
  const { error } = await supabase.from('posts').delete().eq('id', id)
  if (error) throw error
  return id
})

const blogSlice = createSlice({
  name: 'blogs',
  initialState,
  reducers: {
    clearCurrentPost: (state) => {
      state.currentPost = null
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchPosts
      .addCase(fetchPosts.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchPosts.fulfilled, (state, action) => {
        state.loading = false
        state.posts = action.payload.posts
        state.totalCount = action.payload.totalCount
      })
      .addCase(fetchPosts.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message ?? 'Failed to load posts'
      })
      // fetchPost
      .addCase(fetchPost.pending, (state) => {
        state.loadingSingle = true
      })
      .addCase(fetchPost.fulfilled, (state, action) => {
        state.loadingSingle = false
        state.currentPost = action.payload
      })
      .addCase(fetchPost.rejected, (state, action) => {
        state.loadingSingle = false
        state.error = action.error.message ?? 'Failed to load post'
      })
      // create
      .addCase(createPost.fulfilled, (state, action) => {
        state.posts.unshift(action.payload)
        state.totalCount += 1
      })
      // update
      .addCase(updatePost.fulfilled, (state, action) => {
        const index = state.posts.findIndex((p) => p.id === action.payload.id)
        if (index !== -1) state.posts[index] = action.payload
        if (state.currentPost?.id === action.payload.id) state.currentPost = action.payload
      })
      // delete
      .addCase(deletePost.fulfilled, (state, action) => {
        state.posts = state.posts.filter((p) => p.id !== action.payload)
        state.totalCount -= 1
        if (state.currentPost?.id === action.payload) state.currentPost = null
      })
  },
})

export const { clearCurrentPost } = blogSlice.actions
export default blogSlice.reducer