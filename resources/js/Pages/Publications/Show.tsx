import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps, Publication, PublicationSuggestion, Scholar } from '@/types';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

interface PublicationShowProps extends PageProps {
    publication: Publication;
    available_scholars: Scholar[];
}

export default function PublicationShow({
    publication,
}: PublicationShowProps) {
    const { auth } = usePage<PageProps>().props;
    const versions = publication.versions ?? [];
    const suggestions = publication.suggestions ?? [];
    const pendingSuggestions = suggestions.filter((s) => s.status === 'pending');

    const [selectedVersionIndex, setSelectedVersionIndex] = useState(0);
    const activeVersion = versions[selectedVersionIndex] ?? versions[0];
    const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
    const [isSynthesizeModalOpen, setIsSynthesizeModalOpen] = useState(false);
    const [previewingSuggestion, setPreviewingSuggestion] = useState<PublicationSuggestion | null>(null);

    // Form for manual version revision
    const { data: revisionData, setData: setRevisionData, post: postRevision, processing: revisionProcessing, reset: resetRevision, errors: revisionErrors } = useForm({
        content_markdown: activeVersion?.content?.markdown ?? '',
        changelog: '',
    });

    // Form for AI synthesis ingestion
    const { data: synthData, setData: setSynthData, post: postSynth, processing: synthProcessing, reset: resetSynth, errors: synthErrors } = useForm({
        raw_notes: '',
        source_type: 'meeting_notes',
    });

    const handleOpenRevision = () => {
        setRevisionData({
            content_markdown: activeVersion?.content?.markdown ?? '',
            changelog: '',
        });
        setIsRevisionModalOpen(true);
    };

    const submitRevision: FormEventHandler = (e) => {
        e.preventDefault();
        postRevision(route('publications.versions.store', publication.id), {
            onSuccess: () => {
                setIsRevisionModalOpen(false);
                resetRevision();
                setSelectedVersionIndex(0);
            },
        });
    };

    const submitSynthesis: FormEventHandler = (e) => {
        e.preventDefault();
        postSynth(route('publications.synthesize', publication.id), {
            onSuccess: () => {
                setIsSynthesizeModalOpen(false);
                resetSynth();
            },
        });
    };

    const handleApplySuggestion = (suggestionId: string) => {
        router.post(route('publications.suggestions.apply', {
            publication: publication.id,
            suggestion: suggestionId,
        }), {}, {
            onSuccess: () => {
                setPreviewingSuggestion(null);
                setSelectedVersionIndex(0);
            },
        });
    };

    const handleRejectSuggestion = (suggestionId: string) => {
        router.post(route('publications.suggestions.reject', {
            publication: publication.id,
            suggestion: suggestionId,
        }), {}, {
            onSuccess: () => {
                if (previewingSuggestion?.id === suggestionId) {
                    setPreviewingSuggestion(null);
                }
            },
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center space-x-2.5">
                            <span
                                className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                    publication.status === 'published'
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                        : publication.status === 'embargoed'
                                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                                }`}
                            >
                                {publication.status}
                            </span>
                            <span className="text-xs text-slate-400 font-mono">
                                /{publication.slug}
                            </span>
                            {publication.status === 'published' && !publication.is_embargoed && auth.tenant && (
                                <a
                                    href={route('public.publication.show', {
                                        tenant_slug: auth.tenant.slug,
                                        slug: publication.slug,
                                    })}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                >
                                    Public Dissemination Portal ↗
                                </a>
                            )}
                        </div>
                        <h1 className="text-lg md:text-xl font-bold tracking-tight text-slate-900 leading-tight">
                            {publication.title}
                        </h1>
                    </div>

                    <div className="flex items-center space-x-3 shrink-0">
                        <button
                            onClick={() => setIsSynthesizeModalOpen(true)}
                            className="inline-flex items-center px-3 py-1.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 text-xs font-semibold hover:bg-purple-100 transition shadow-xs"
                        >
                            ⚡ Agentic Synthesis
                        </button>
                        <button
                            onClick={handleOpenRevision}
                            className="inline-flex items-center px-3.5 py-1.5 rounded-md bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition shadow-xs"
                        >
                            + Commit Revision (v{(versions[0]?.version_number ?? 1) + 1})
                        </button>
                    </div>
                </div>
            }
        >
            <Head title={publication.title} />

            <div className="space-y-6">
                {/* Embargo Alert Banner */}
                {publication.is_embargoed && (
                    <div className="p-4 rounded-lg bg-amber-50 border border-amber-200/90 text-amber-900 flex items-start space-x-3 shadow-xs">
                        <span className="text-base">🔒</span>
                        <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                                Strictly Embargoed Research Brief
                            </h4>
                            <p className="text-xs text-amber-800 mt-0.5">
                                Public reader access is locked down until{' '}
                                <strong className="font-semibold">
                                    {publication.embargo_until
                                        ? new Date(publication.embargo_until).toLocaleString()
                                        : 'the specified release date'}
                                </strong>
                                . External requests to the public URL will return a strict 404.
                            </p>
                        </div>
                    </div>
                )}

                {/* Staged AI Proposals Callout Banner */}
                {pendingSuggestions.length > 0 && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-5 shadow-xs space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <span className="h-2 w-2 rounded-full bg-purple-600 animate-pulse" />
                                <h3 className="text-xs font-bold uppercase tracking-wider text-purple-900">
                                    Agentic Synthesis Proposal Ready ({pendingSuggestions.length} Pending)
                                </h3>
                            </div>
                            <span className="text-[11px] text-purple-700 font-medium">
                                Staged non-destructively for editorial approval
                            </span>
                        </div>

                        {pendingSuggestions.map((suggestion) => (
                            <div
                                key={suggestion.id}
                                className="bg-white p-4 rounded-md border border-purple-150 flex flex-col md:flex-row md:items-center justify-between gap-4"
                            >
                                <div className="space-y-1">
                                    <div className="flex items-center space-x-2">
                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-800">
                                            {suggestion.source_type.replace('_', ' ')}
                                        </span>
                                        <span className="text-[11px] text-slate-400">
                                            Synthesized {new Date(suggestion.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-700 font-medium">
                                        {suggestion.reasoning_summary}
                                    </p>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    <button
                                        onClick={() => setPreviewingSuggestion(suggestion)}
                                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded transition"
                                    >
                                        Inspect Diff
                                    </button>
                                    <button
                                        onClick={() => handleApplySuggestion(suggestion.id)}
                                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded transition shadow-xs"
                                    >
                                        Merge as v{(versions[0]?.version_number ?? 1) + 1}
                                    </button>
                                    <button
                                        onClick={() => handleRejectSuggestion(suggestion.id)}
                                        className="px-2.5 py-1.5 text-rose-600 hover:text-rose-800 text-xs font-semibold transition"
                                    >
                                        Dismiss
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Inspect Staged Suggestion Modal/Drawer */}
                {previewingSuggestion && (
                    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-4xl w-full p-6 space-y-5">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <div>
                                    <h2 className="text-base font-bold text-slate-900">
                                        Inspect Staged AI Synthesis ({previewingSuggestion.source_type})
                                    </h2>
                                    <p className="text-xs text-slate-500">
                                        Review proposed additions before committing to the immutable version history.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setPreviewingSuggestion(null)}
                                    className="text-slate-400 hover:text-slate-600"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                                        Ingested Raw Source Notes
                                    </label>
                                    <div className="bg-slate-50 p-4 rounded border border-slate-200 text-xs font-mono text-slate-600 h-80 overflow-y-auto whitespace-pre-wrap">
                                        {previewingSuggestion.source_notes}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-purple-700 uppercase tracking-wider block">
                                        Proposed Synthesis Output
                                    </label>
                                    <div className="bg-purple-50/50 p-4 rounded border border-purple-200 text-xs font-mono text-slate-800 h-80 overflow-y-auto whitespace-pre-wrap">
                                        {previewingSuggestion.suggested_markdown}
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setPreviewingSuggestion(null)}
                                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                                >
                                    Close Inspection
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleApplySuggestion(previewingSuggestion.id)}
                                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded shadow-xs transition"
                                >
                                    Accept & Merge as v{(versions[0]?.version_number ?? 1) + 1}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Two-Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Left: Document Reading Canvas */}
                    <div className="lg:col-span-3 space-y-6">
                        {publication.summary && (
                            <div className="bg-white p-5 rounded-lg border border-slate-200 text-xs text-slate-600 leading-relaxed italic border-l-4 border-l-slate-800 shadow-xs">
                                <strong>Executive Summary:</strong> {publication.summary}
                            </div>
                        )}

                        {/* Active Version Content */}
                        <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-8 space-y-4 min-h-[500px]">
                            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                                <div className="flex items-center space-x-2">
                                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-xs font-bold font-mono">
                                        v{activeVersion?.version_number ?? 1}
                                    </span>
                                    <span className="text-xs text-slate-500">
                                        Committed by {activeVersion?.created_by ?? 'Institutional Editor'} on{' '}
                                        {activeVersion ? new Date(activeVersion.created_at).toLocaleDateString() : ''}
                                    </span>
                                </div>
                                {activeVersion?.changelog && (
                                    <span className="text-xs text-slate-400 italic">
                                        "{activeVersion.changelog}"
                                    </span>
                                )}
                            </div>

                            {/* Markdown Content Display */}
                            <div className="prose prose-slate max-w-none text-xs leading-relaxed font-mono whitespace-pre-wrap bg-slate-50/50 p-6 rounded border border-slate-150">
                                {activeVersion?.content?.markdown ?? 'No manuscript content available.'}
                            </div>
                        </div>
                    </div>

                    {/* Right Sidebar: Authors & Immutable Version Timeline */}
                    <div className="space-y-6">
                        {/* Authors Box */}
                        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-3">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                Institutional Authorship
                            </h3>
                            <div className="space-y-2">
                                {(!publication.authors || publication.authors.length === 0) ? (
                                    <div className="text-xs text-slate-400">Institutional Faculty</div>
                                ) : (
                                    publication.authors.map((author) => (
                                        <div key={author.id} className="flex items-center justify-between">
                                            <div>
                                                <div className="text-xs font-bold text-slate-900">
                                                    {author.name}
                                                </div>
                                                {author.title && (
                                                    <div className="text-[11px] text-slate-500">
                                                        {author.title}
                                                    </div>
                                                )}
                                            </div>
                                            {author.is_lead_author && (
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                                                    Lead
                                                </span>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Immutable Version Timeline */}
                        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                    Editorial Revisions
                                </h3>
                                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                    Immutable
                                </span>
                            </div>

                            <div className="space-y-2">
                                {versions.map((ver, index) => (
                                    <button
                                        key={ver.id}
                                        onClick={() => setSelectedVersionIndex(index)}
                                        className={`w-full text-left p-3 rounded-md transition border ${
                                            selectedVersionIndex === index
                                                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                                                : 'bg-slate-50 text-slate-700 border-slate-200/80 hover:bg-slate-100'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-xs font-mono">
                                                Version {ver.version_number}
                                            </span>
                                            <span
                                                className={`text-[10px] ${
                                                    selectedVersionIndex === index ? 'text-slate-300' : 'text-slate-400'
                                                }`}
                                            >
                                                {new Date(ver.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        {ver.changelog && (
                                            <p
                                                className={`text-[11px] mt-1 line-clamp-1 ${
                                                    selectedVersionIndex === index ? 'text-slate-200' : 'text-slate-500'
                                                }`}
                                            >
                                                {ver.changelog}
                                            </p>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Commit Revision Modal */}
            {isRevisionModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-3xl w-full p-6 space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div>
                                <h2 className="text-base font-bold text-slate-900">
                                    Commit Editorial Revision v{(versions[0]?.version_number ?? 1) + 1}
                                </h2>
                                <p className="text-xs text-slate-500">
                                    Creates an immutable snapshot preserving all prior versions.
                                </p>
                            </div>
                            <button
                                onClick={() => setIsRevisionModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={submitRevision} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Changelog Reason
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Incorporated defense trade data tables and peer citations."
                                    value={revisionData.changelog}
                                    onChange={(e) => setRevisionData('changelog', e.target.value)}
                                    className="w-full text-xs rounded border-slate-300 focus:ring-slate-500 focus:border-slate-500"
                                />
                                {revisionErrors.changelog && (
                                    <p className="text-rose-600 text-[11px] mt-1">{revisionErrors.changelog}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Manuscript Content (Markdown)
                                </label>
                                <textarea
                                    rows={12}
                                    required
                                    value={revisionData.content_markdown}
                                    onChange={(e) => setRevisionData('content_markdown', e.target.value)}
                                    className="w-full font-mono text-xs rounded border-slate-300 focus:ring-slate-500 focus:border-slate-500 leading-relaxed"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsRevisionModalOpen(false)}
                                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={revisionProcessing}
                                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded shadow-xs transition"
                                >
                                    {revisionProcessing ? 'Committing...' : 'Commit Immutable Revision'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Agentic Synthesis Ingestion Modal */}
            {isSynthesizeModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-2xl w-full p-6 space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div>
                                <h2 className="text-base font-bold text-slate-900">
                                    Agentic Synthesis: Ingest Raw Notes & Propose Draft
                                </h2>
                                <p className="text-xs text-slate-500">
                                    Ingests unvetted notes, sanitizes PII, and stages a proposal for editorial approval without overwriting the live manuscript.
                                </p>
                            </div>
                            <button
                                onClick={() => setIsSynthesizeModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={submitSynthesis} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Source Ingestion Type
                                </label>
                                <select
                                    value={synthData.source_type}
                                    onChange={(e) => setSynthData('source_type', e.target.value)}
                                    className="w-full text-xs rounded border-slate-300 focus:ring-slate-500 focus:border-slate-500"
                                >
                                    <option value="meeting_notes">Roundtable & Working Group Notes</option>
                                    <option value="transcript">Live Stream / Audio Transcript</option>
                                    <option value="outline">Policy Outline & Strategic Memo</option>
                                    <option value="rough_notes">Rough Research Field Notes</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Raw Notes & Transcripts
                                </label>
                                <textarea
                                    rows={8}
                                    required
                                    placeholder="Paste unformatted meeting transcripts, speaker bullet points, or rough notes here..."
                                    value={synthData.raw_notes}
                                    onChange={(e) => setSynthData('raw_notes', e.target.value)}
                                    className="w-full font-mono text-xs rounded border-slate-300 focus:ring-slate-500 focus:border-slate-500 leading-relaxed"
                                />
                                {synthErrors.raw_notes && (
                                    <p className="text-rose-600 text-[11px] mt-1">{synthErrors.raw_notes}</p>
                                )}
                            </div>

                            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsSynthesizeModalOpen(false)}
                                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={synthProcessing}
                                    className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold rounded shadow-xs transition"
                                >
                                    {synthProcessing ? 'Synthesizing...' : 'Run Agentic Synthesis'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
