import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { supabase } from '../../lib/supabaseClient'
import type { Post } from '../../types/post'

interface BlogsState {
  posts: Post[]
  loading: boolean
  error: string | null
  totalCount: number
}

const initialState: BlogsState = {
  posts: [],
  loading: false,
  error: null,
  totalCount: 0,
}

const PAGE_SIZE = 10

// Fetch paginated posts + total count
export const fetchPosts = createAsyncThunk(
  'blogs/fetchPosts',
  async (page: number = 0) => {
    const from = page * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    const [{ data, count, error: countError }, { data: posts, error: postsError }] = await Promise.all([
      supabase.from('posts').select('*', { count: 'exact', head: true }),
      supabase.from('posts').select('*').order('created_at', { ascending: false }).range(from, to),
    ])

    if (countError || postsError) throw countError || postsError

    return { posts: posts as Post[], totalCount: count ?? 0 }
  }
)

export const createPost = createAsyncThunk('blogs/createPost', async (post: { title: string; content: string }) => {
  const { data, error } = await supabase.from('posts').insert(post).select().single()
  if (error) throw error
  return data as Post
})

export const updatePost = createAsyncThunk(
  'blogs/updatePost',
  async ({ id, ...updates }: { id: string; title: string; content: string }) => {
    const { data, error } = await supabase.from('posts').update(updates).eq('id', id).select().single()
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
  reducers: {},
  extraReducers: (builder) => {
    builder
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
      .addCase(createPost.fulfilled, (state, action) => {
        state.posts.unshift(action.payload)
        state.totalCount += 1
      })
      .addCase(updatePost.fulfilled, (state, action) => {
        const index = state.posts.findIndex((p) => p.id === action.payload.id)
        if (index !== -1) state.posts[index] = action.payload
      })
      .addCase(deletePost.fulfilled, (state, action) => {
        state.posts = state.posts.filter((p) => p.id !== action.payload)
        state.totalCount -= 1
      })
  },
})

export default blogSlice.reducer