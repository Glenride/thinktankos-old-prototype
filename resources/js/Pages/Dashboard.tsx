import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { EventItem, PageProps, Publication } from '@/types';
import { Head, Link } from '@inertiajs/react';

interface DashboardProps extends PageProps {
    metrics: {
        active_scholars: number;
        total_publications: number;
        embargoed_briefs: number;
        upcoming_events: number;
    };
    recent_publications: Publication[];
    upcoming_events: EventItem[];
}

export default function Dashboard({
    metrics,
    recent_publications,
    upcoming_events,
}: DashboardProps) {
    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-slate-900">
                            Executive Overview
                        </h1>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Real-time institute talent, publishing status, and upcoming salon intelligence.
                        </p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <Link
                            href={route('publications.index')}
                            className="inline-flex items-center px-3 py-1.5 rounded-md bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition shadow-xs"
                        >
                            + Draft Brief
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title="Command Center" />

            <div className="space-y-8">
                {/* Metrics Grid */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="bg-white p-5 rounded-lg border border-slate-200/90 shadow-xs">
                        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Active Scholars & Fellows
                        </div>
                        <div className="mt-2 flex items-baseline justify-between">
                            <div className="text-2xl font-bold tracking-tight text-slate-900">
                                {metrics.active_scholars}
                            </div>
                            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                                Scoped
                            </span>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-lg border border-slate-200/90 shadow-xs">
                        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Policy Briefs & Reports
                        </div>
                        <div className="mt-2 flex items-baseline justify-between">
                            <div className="text-2xl font-bold tracking-tight text-slate-900">
                                {metrics.total_publications}
                            </div>
                            <span className="text-xs font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                                Total
                            </span>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-lg border border-slate-200/90 shadow-xs">
                        <div className="text-xs font-semibold uppercase tracking-wider text-amber-700">
                            Embargoed Research
                        </div>
                        <div className="mt-2 flex items-baseline justify-between">
                            <div className="text-2xl font-bold tracking-tight text-amber-900">
                                {metrics.embargoed_briefs}
                            </div>
                            <span className="text-xs font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60">
                                Confidential
                            </span>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-lg border border-slate-200/90 shadow-xs">
                        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Roundtables & Salons
                        </div>
                        <div className="mt-2 flex items-baseline justify-between">
                            <div className="text-2xl font-bold tracking-tight text-slate-900">
                                {metrics.upcoming_events}
                            </div>
                            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                                Scheduled
                            </span>
                        </div>
                    </div>
                </div>

                {/* Split Two-Column Workbench */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Recent Publications */}
                    <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                                Recent Editorial Submissions
                            </h2>
                            <Link
                                href={route('publications.index')}
                                className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                            >
                                View Pipeline &rarr;
                            </Link>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {recent_publications.length === 0 ? (
                                <div className="p-6 text-center text-xs text-slate-500">
                                    No policy briefs recorded in this institute scope yet.
                                </div>
                            ) : (
                                recent_publications.map((pub) => (
                                    <Link
                                        key={pub.id}
                                        href={route('publications.show', pub.id)}
                                        className="p-5 block hover:bg-slate-50/80 transition"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="space-y-1">
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
                                                </div>
                                                <h3 className="text-sm font-semibold text-slate-900 leading-snug">
                                                    {pub.title}
                                                </h3>
                                                {pub.summary && (
                                                    <p className="text-xs text-slate-500 line-clamp-2">
                                                        {pub.summary}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="text-right shrink-0">
                                                <span className="text-[11px] text-slate-400">
                                                    v{pub.versions_count ?? 1} revision
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Upcoming Salons & Roundtables */}
                    <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                                Salons & Roundtables
                            </h2>
                            <Link
                                href={route('events.index')}
                                className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                            >
                                All Events &rarr;
                            </Link>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {upcoming_events.length === 0 ? (
                                <div className="p-6 text-center text-xs text-slate-500">
                                    No upcoming salons scheduled.
                                </div>
                            ) : (
                                upcoming_events.map((event) => (
                                    <div key={event.id} className="p-5 space-y-2">
                                        <div className="flex items-center space-x-2">
                                            {event.chatham_house_rule && (
                                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200">
                                                    Chatham House
                                                </span>
                                            )}
                                            <span className="text-[11px] font-medium text-slate-500">
                                                {new Date(event.starts_at).toLocaleDateString(undefined, {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </span>
                                        </div>
                                        <h3 className="text-xs font-bold text-slate-900 leading-snug">
                                            {event.title}
                                        </h3>
                                        {event.description && (
                                            <p className="text-xs text-slate-500 line-clamp-2">
                                                {event.description}
                                            </p>
                                        )}
                                        <div className="text-[11px] text-slate-400 pt-1">
                                            {event.registrations_count ?? 0} confirmed invitees
                                            {event.capacity ? ` / ${event.capacity} capacity` : ''}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
