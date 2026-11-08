export interface User {
    id: string;
    name: string;
    email: string;
    email_verified_at?: string | null;
}

export interface Tenant {
    id: string;
    name: string;
    slug: string;
}

export interface AuthContext {
    user: User | null;
    tenant: Tenant | null;
    role: string;
    permissions: string[];
}

export interface Scholar {
    id: string;
    first_name: string;
    last_name: string;
    name: string;
    slug: string;
    title: string;
    bio: string | null;
    expertise_tags: string[];
    is_active: boolean;
    created_at?: string;
}

export interface PublicationAuthor {
    id: string;
    scholar_id?: string | null;
    name: string;
    title?: string | null;
    is_lead_author: boolean;
    display_order: number;
}

export interface PublicationVersion {
    id: string;
    version_number: number;
    content: {
        markdown: string;
    };
    changelog: string | null;
    created_at: string;
    created_by?: string | null;
}

export interface PublicationSuggestion {
    id: string;
    source_type: string;
    source_notes: string;
    suggested_markdown: string;
    reasoning_summary: string | null;
    status: 'pending' | 'applied' | 'rejected';
    created_at: string;
    created_by?: string | null;
}

export interface Publication {
    id: string;
    title: string;
    slug: string;
    summary: string | null;
    status: 'draft' | 'review' | 'embargoed' | 'published' | 'archived';
    is_embargoed: boolean;
    embargo_until?: string | null;
    published_at?: string | null;
    created_at: string;
    updated_at?: string;
    authors?: PublicationAuthor[];
    versions?: PublicationVersion[];
    versions_count?: number;
    suggestions?: PublicationSuggestion[];
}

export interface EventRegistration {
    id: string;
    full_name: string;
    email: string;
    organization?: string | null;
    title?: string | null;
    status: 'pending' | 'approved' | 'declined' | 'attended';
    checked_in_at?: string | null;
}

export interface EventItem {
    id: string;
    title: string;
    slug: string;
    description: string | null;
    chatham_house_rule: boolean;
    visibility: 'public' | 'invitation_only' | 'closed_door';
    starts_at: string;
    ends_at: string;
    capacity: number | null;
    registrations_count?: number;
}

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
    auth: AuthContext;
    flash?: {
        success?: string;
        error?: string;
    };
};
