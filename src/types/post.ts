export interface Post {
    id: string
    user_id: string
    title: string
    content: string
    author_email: string
    created_at: string
    updated_at?: string
    image_url?: string | null
}

export interface Comment {
    id: string
    post_id: string
    user_id: string | null
    content: string
    author_email: string
    image_url?: string | null
    created_at: string
    updated_at?: string
}