// Post interface definition
export interface Post {
    id: string;
    user_id: string | null;
    title: string;
    content: string;
    author_email: string;
    created_at: string;
    updated_at?: string;
    image_url?: string | null;
    original_user_id?: string | null;  // For account deactivation/reactivation
    comment_count?: number; // Number of comments on the post
}

// Comment interface definition
export interface Comment {
    id: string;
    post_id: string;
    user_id: string | null;
    content: string;
    author_email: string;
    image_url?: string | null;
    original_user_id?: string | null;  // For account deactivation/reactivation
    parent_id: string | null; // For Replies
    is_edited: boolean;
    replies?: Comment[]; // For nested replied in frontend
    created_at: string;
    updated_at?: string;
    
    
}