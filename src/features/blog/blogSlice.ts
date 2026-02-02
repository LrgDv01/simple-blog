import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { supabase } from '../../lib/supabaseClient'
import type { Post, Comment } from '../../types/post'

// State interface definition
interface BlogsState {
  posts: Post[]
  currentPost: Post | null
  comments: Comment[]
  loading: boolean
  loadingSingle: boolean
  loadingComments: boolean
  error: string | null
  totalCount: number
}

// Initial state definition
const initialState: BlogsState = {
  posts: [],
  currentPost: null,
  loading: false,
  loadingSingle: false,
  error: null,
  totalCount: 0,
  comments: [],
  loadingComments: false,
}

const PAGE_SIZE = 10 // Number of posts per page

// Async thunk to fetch comments for a post
export const fetchComments = createAsyncThunk(
  'blogs/fetchComments',
  async (postId: string) => {
    const { data, error } = await supabase    
      .from('comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true })
    if (error) throw error
    return data as Comment[]
  }
)

// Async thunk to create a new comment
export const createComment = createAsyncThunk(
  'blogs/createComment',
  async ({ postId, user_id, content, image_url, author_email }: {
    postId: string
    user_id: string
    content: string
    image_url?: string
    author_email: string
  }) => {
    const { data, error } = await supabase
      .from('comments')
      .insert({ post_id: postId, user_id, content, image_url, author_email })
      .select()
      .single()
    if (error) throw error
    return data as Comment
  }
)

// Fetch paginated posts
export const fetchPosts = createAsyncThunk(
  'blogs/fetchPosts',
  async (page: number = 0) => {
    const from = page * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    // Fetch posts with total count
    const [{ data: posts, count, error: postsError }] = await Promise.all([
      supabase
        .from('posts')
        .select('id, title, content, created_at, author_email, user_id, image_url', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to),
    ])

    if (postsError) throw postsError

    // Fetch comment counts for the posts
    const postIds = posts?.map(post => post.id) || []
    let commentCounts: Record<string, number> = {}
    
    if (postIds.length > 0) {
      const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
        .select('post_id')
        .in('post_id', postIds)
      
      if (!commentsError && commentsData) {
        // Count comments per post
        commentsData.forEach(comment => {
          commentCounts[comment.post_id] = (commentCounts[comment.post_id] || 0) + 1
        })
      }
    }

    // Merge comment counts into posts
    const postsWithCounts = posts?.map(post => ({
      ...post,
      comment_count: commentCounts[post.id] || 0
    })) || []

    return { posts: postsWithCounts as Post[], totalCount: count ?? 0 } // Return total count
  }
)

// Fetch a single post by ID
export const fetchPost = createAsyncThunk(
  'blogs/fetchPost',
  async ({ id }: { id: string }, { dispatch}) => {
    const { data, error } = await supabase
      .from('posts')
      .select('id, title, content, created_at, author_email, user_id, image_url')
      .eq('id', id)
      .single()

    if (error) throw error

    // Also fetch comments for the post
    dispatch(fetchComments(id))

    return data as Post
})

// Create a new post
export const createPost = createAsyncThunk(
  'blogs/createPost',
  async ({ title, content, author_email, image_url }: { title: string; content: string; author_email: string; image_url?: string }) => {
    const { data, error } = await supabase
      .from('posts')
      .insert({ title, content, author_email, image_url })
      .select()
      .single()
    if (error) throw error
    return data as Post
  }
)

// Update an existing post
export const updatePost = createAsyncThunk(
  'blogs/updatePost',
  async ({ id, title, content, author_email, image_url }: { id: string; title: string; content: string; author_email: string; image_url?: string }) => {
    // Prepare update object
    const updates: any = { title, content, author_email }
    if (image_url !== undefined) updates.image_url = image_url // Only include if provided
    
    // Perform the update
    const { data, error } = await supabase
      .from('posts')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as Post
  }
)

// Delete a post by ID
export const deletePost = createAsyncThunk('blogs/deletePost', async (id: string) => {
  const { error } = await supabase.from('posts').delete().eq('id', id)
  if (error) throw error
  return id
})

// Blog slice definition
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

      // fetchComments
      .addCase(fetchComments.pending, (state) => {
        state.loadingComments = true  
      })
      .addCase(fetchComments.fulfilled, (state, action) => {
        state.loadingComments = false
        state.comments = action.payload
      })
      .addCase(fetchComments.rejected, (state, action) => {
        state.loadingComments = false
        state.error = action.error.message ?? 'Failed to load comments'
      })
      // Optimistic create comment
      .addCase(createComment.pending, (state, action) => {
        const tempId = 'temp-' + Date.now()
        const optimisticComment: Comment = {
          id: tempId,
          post_id: action.meta.arg.postId,
          user_id: action.meta.arg.user_id,
          content: action.meta.arg.content,
          author_email: action.meta.arg.author_email,
          image_url: action.meta.arg.image_url,
          created_at: new Date().toISOString(),
        }
        state.comments.push(optimisticComment)
      })
      .addCase(createComment.fulfilled, (state, action) => {
        // Replace temp comment with real one
        state.comments = state.comments.map(c =>
          c.id.startsWith('temp-') ? action.payload : c
        )
      })
      .addCase(createComment.rejected, (state) => {
        // Remove the optimistic comment on failure
        state.comments = state.comments.filter(c => !c.id.startsWith('temp-'))
      })
  },
})

export const { clearCurrentPost } = blogSlice.actions
export default blogSlice.reducer