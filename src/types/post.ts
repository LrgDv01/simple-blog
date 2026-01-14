export interface Post {
    id: string
    user_id: string
    title: string
    content: string
    author_email: string
    created_at: string
    updated_at?: string
}