import { Head } from '@inertiajs/react';

interface PublicPublicationProps {
    tenant: {
        name: string;
        slug: string;
    };
    publication: {
        title: string;
        summary: string | null;
        published_at: string;
        content_markdown: string;
        authors: Array<{
            name: string;
            title?: string | null;
            is_lead_author: boolean;
        }>;
    };
}

export default function PublicPublication({
    tenant,
    publication,
}: PublicPublicationProps) {
    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans antialiased selection:bg-slate-900 selection:text-white">
            <Head title={`${publication.title} — ${tenant.name}`} />

            {/* Institute Public Header */}
            <header className="border-b border-slate-200/80 bg-white/95 backdrop-blur-xs sticky top-0 z-30">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="h-7 w-7 rounded-md bg-slate-900 flex items-center justify-center text-white font-bold text-xs tracking-wider">
                            TT
                        </div>
                        <span className="font-bold tracking-tight text-slate-900 text-sm">
                            {tenant.name}
                        </span>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                        Public Policy Brief
                    </span>
                </div>
            </header>

            {/* Document Body */}
            <main className="max-w-3xl mx-auto px-6 py-12 md:py-16 space-y-8">
                {/* Meta & Title */}
                <div className="space-y-4 border-b border-slate-200 pb-8">
                    <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        <span>Released {publication.published_at}</span>
                        <span>•</span>
                        <span>Official Publication</span>
                    </div>

                    <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-slate-950 leading-tight">
                        {publication.title}
                    </h1>

                    {/* Authors List */}
                    {publication.authors.length > 0 && (
                        <div className="flex flex-wrap items-center gap-y-2 gap-x-6 pt-2">
                            {publication.authors.map((author, index) => (
                                <div key={index} className="text-xs">
                                    <span className="font-bold text-slate-900">{author.name}</span>
                                    {author.title && (
                                        <span className="text-slate-500 ml-1.5 font-normal">
                                            ({author.title})
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Executive Summary Callout */}
                {publication.summary && (
                    <div className="p-6 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed font-serif italic">
                        <strong className="font-sans font-bold not-italic text-slate-900 block mb-1">
                            Executive Summary:
                        </strong>
                        {publication.summary}
                    </div>
                )}

                {/* Manuscript Content */}
                <article className="prose prose-slate max-w-none text-sm leading-relaxed font-serif whitespace-pre-wrap py-4">
                    {publication.content_markdown}
                </article>

                {/* Footer Dissemination Notice */}
                <footer className="pt-12 border-t border-slate-200 text-xs text-slate-400 space-y-1 font-sans">
                    <p>
                        Published by {tenant.name}. All analytical methodologies, data schemas, and multilateral recommendations are licensed under institutional fair use.
                    </p>
                    <p className="text-[11px] text-slate-400">
                        Disseminated via ThinkTank OS Sovereign Policy Protocol.
                    </p>
                </footer>
            </main>
        </div>
    );
}
