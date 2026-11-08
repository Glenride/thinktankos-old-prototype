import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps, Publication } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

interface PublicationsIndexProps extends PageProps {
    publications: Publication[];
    filters: {
        status: string;
        search: string;
    };
}

export default function PublicationsIndex({
    publications,
    filters,
}: PublicationsIndexProps) {
    const [isDraftModalOpen, setIsDraftModalOpen] = useState(false);

    const { data, setData, post, processing, reset, errors } = useForm({
        title: '',
        summary: '',
        status: 'draft',
        embargo_until: '',
        content_markdown: '# Executive Summary\n\n[Synthesize core analytical findings and multilateral policy implications here...]',
    });

    const handleFilterStatus = (status: string) => {
        router.get(
            route('publications.index'),
            { status: filters.status === status ? '' : status, search: filters.search },
            { preserveState: true }
        );
    };

    const submitDraft: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('publications.store'), {
            onSuccess: () => {
                setIsDraftModalOpen(false);
                reset();
            },
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-slate-900">
                            Policy Publishing Engine
                        </h1>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Institutional research manuscripts, multi-version editorial revisions, and embargo scheduling.
                        </p>
                    </div>
                    <button
                        onClick={() => setIsDraftModalOpen(true)}
                        className="inline-flex items-center px-3.5 py-1.5 rounded-md bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition shadow-xs"
                    >
                        + Draft Policy Brief
                    </button>
                </div>
            }
        >
            <Head title="Publishing Engine" />

            <div className="space-y-6">
                {/* Status Filter Tabs */}
                <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-xs flex flex-wrap items-center gap-1.5">
                    {['', 'draft', 'review', 'embargoed', 'published'].map((statusKey) => (
                        <button
                            key={statusKey}
                            onClick={() => handleFilterStatus(statusKey)}
                            className={`px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider transition ${
                                filters.status === statusKey
                                    ? 'bg-slate-900 text-white shadow-xs'
                                    : 'bg-transparent text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            {statusKey === '' ? 'All Research' : statusKey}
                        </button>
                    ))}
                </div>

                {/* Publications Table */}
                <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
                    <div className="divide-y divide-slate-100">
                        {publications.length === 0 ? (
                            <div className="p-12 text-center text-xs text-slate-500">
                                No policy research papers match the selected status filter.
                            </div>
                        ) : (
                            publications.map((pub) => (
                                <div
                                    key={pub.id}
                                    className="p-6 hover:bg-slate-50/70 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                                >
                                    <div className="space-y-1.5 max-w-3xl">
                                        <div className="flex items-center space-x-2">
                                            <span
                                                className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                                    pub.status === 'published'
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : pub.status === 'embargoed'
                                                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                                                }`}
                                            >
                                                {pub.status}
                                            </span>

                                            {pub.is_embargoed && (
                                                <span className="text-[11px] font-medium text-amber-700">
                                                    🔒 Embargoed until {new Date(pub.embargo_until!).toLocaleDateString()}
                                                </span>
                                            )}

                                            <span className="text-[11px] text-slate-400 font-medium">
                                                v{pub.versions_count ?? 1} revision
                                            </span>
                                        </div>

                                        <Link
                                            href={route('publications.show', pub.id)}
                                            className="text-base font-bold text-slate-900 hover:text-slate-700 leading-snug block"
                                        >
                                            {pub.title}
                                        </Link>

                                        {pub.summary && (
                                            <p className="text-xs text-slate-500 line-clamp-2">
                                                {pub.summary}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-3 shrink-0">
                                        <Link
                                            href={route('publications.show', pub.id)}
                                            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded transition"
                                        >
                                            Editorial Workbench &rarr;
                                        </Link>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Draft Brief Modal */}
            {isDraftModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-2xl w-full p-6 space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-base font-bold text-slate-900">
                                Initialize Policy Brief Manuscript
                            </h2>
                            <button
                                onClick={() => setIsDraftModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={submitDraft} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Document Title
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Critical Mineral Chokepoints: Strategic Stockpile Architecture"
                                    value={data.title}
                                    onChange={(e) => setData('title', e.target.value)}
                                    className="w-full text-xs rounded border-slate-300 focus:ring-slate-500 focus:border-slate-500"
                                />
                                {errors.title && (
                                    <p className="text-rose-600 text-[11px] mt-1">{errors.title}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Executive Summary
                                </label>
                                <textarea
                                    rows={2}
                                    value={data.summary}
                                    onChange={(e) => setData('summary', e.target.value)}
                                    placeholder="High-level policy takeaway for directors and ministers..."
                                    className="w-full text-xs rounded border-slate-300 focus:ring-slate-500 focus:border-slate-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Editorial Status
                                    </label>
                                    <select
                                        value={data.status}
                                        onChange={(e) => setData('status', e.target.value as any)}
                                        className="w-full text-xs rounded border-slate-300 focus:ring-slate-500 focus:border-slate-500"
                                    >
                                        <option value="draft">Internal Working Draft</option>
                                        <option value="review">Peer / Legal Review</option>
                                        <option value="embargoed">Embargoed (Confidential)</option>
                                        <option value="published">Immediate Release</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Embargo Release Timestamp (Optional)
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={data.embargo_until}
                                        onChange={(e) => setData('embargo_until', e.target.value)}
                                        className="w-full text-xs rounded border-slate-300 focus:ring-slate-500 focus:border-slate-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Initial Markdown Content (Version 1)
                                </label>
                                <textarea
                                    rows={6}
                                    required
                                    value={data.content_markdown}
                                    onChange={(e) => setData('content_markdown', e.target.value)}
                                    className="w-full font-mono text-xs rounded border-slate-300 focus:ring-slate-500 focus:border-slate-500 leading-relaxed"
                                />
                                {errors.content_markdown && (
                                    <p className="text-rose-600 text-[11px] mt-1">{errors.content_markdown}</p>
                                )}
                            </div>

                            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsDraftModalOpen(false)}
                                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded shadow-xs transition"
                                >
                                    {processing ? 'Initializing...' : 'Commit Version 1'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
