import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { EventItem, PageProps } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

interface EventsIndexProps extends PageProps {
    events: EventItem[];
}

export default function EventsIndex({ events }: EventsIndexProps) {
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

    const { data, setData, post, processing, reset, errors } = useForm({
        title: '',
        description: '',
        chatham_house_rule: false,
        visibility: 'closed_door',
        starts_at: '',
        ends_at: '',
        capacity: 30,
    });

    const submitSchedule: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('events.store'), {
            onSuccess: () => {
                setIsScheduleModalOpen(false);
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
                            High-Stakes Salons & Events
                        </h1>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Chatham House roundtables, diplomatic forums, and off-the-record salon rosters.
                        </p>
                    </div>
                    <button
                        onClick={() => setIsScheduleModalOpen(true)}
                        className="inline-flex items-center px-3.5 py-1.5 rounded-md bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition shadow-xs"
                    >
                        + Schedule Salon
                    </button>
                </div>
            }
        >
            <Head title="Salons & Events" />

            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {events.length === 0 ? (
                        <div className="col-span-full bg-white p-12 text-center rounded-lg border border-slate-200">
                            <p className="text-xs text-slate-500">
                                No salons or roundtables scheduled in this institute scope.
                            </p>
                        </div>
                    ) : (
                        events.map((event) => (
                            <div
                                key={event.id}
                                className="bg-white rounded-lg border border-slate-200 p-6 flex flex-col justify-between shadow-xs hover:border-slate-300 transition"
                            >
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                            {new Date(event.starts_at).toLocaleDateString(undefined, {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric',
                                            })}
                                        </span>
                                        <div className="flex items-center space-x-1.5">
                                            {event.chatham_house_rule && (
                                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200">
                                                    Chatham House
                                                </span>
                                            )}
                                            <span
                                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                                    event.visibility === 'closed_door'
                                                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                                        : event.visibility === 'invitation_only'
                                                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                                                }`}
                                            >
                                                {event.visibility.replace('_', ' ')}
                                            </span>
                                        </div>
                                    </div>

                                    <h3 className="text-base font-bold text-slate-900 leading-snug">
                                        {event.title}
                                    </h3>

                                    {event.description && (
                                        <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                                            {event.description}
                                        </p>
                                    )}
                                </div>

                                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                                    <div>
                                        <strong className="text-slate-900 font-semibold">
                                            {event.registrations_count ?? 0}
                                        </strong>{' '}
                                        confirmed invitees
                                    </div>
                                    {event.capacity && (
                                        <span>Limit: {event.capacity} seats</span>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Schedule Salon Modal */}
            {isScheduleModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-xl w-full p-6 space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-base font-bold text-slate-900">
                                Schedule High-Stakes Salon / Roundtable
                            </h2>
                            <button
                                onClick={() => setIsScheduleModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={submitSchedule} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Event Title
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Trans-Pacific Defense Trade & Strategic Supply Chains"
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
                                    Description / Agenda Focus
                                </label>
                                <textarea
                                    rows={3}
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    placeholder="Key objectives, participating diplomatic missions, discussion questions..."
                                    className="w-full text-xs rounded border-slate-300 focus:ring-slate-500 focus:border-slate-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Starts At
                                    </label>
                                    <input
                                        type="datetime-local"
                                        required
                                        value={data.starts_at}
                                        onChange={(e) => setData('starts_at', e.target.value)}
                                        className="w-full text-xs rounded border-slate-300 focus:ring-slate-500 focus:border-slate-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Ends At
                                    </label>
                                    <input
                                        type="datetime-local"
                                        required
                                        value={data.ends_at}
                                        onChange={(e) => setData('ends_at', e.target.value)}
                                        className="w-full text-xs rounded border-slate-300 focus:ring-slate-500 focus:border-slate-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Access Visibility
                                    </label>
                                    <select
                                        value={data.visibility}
                                        onChange={(e) => setData('visibility', e.target.value as any)}
                                        className="w-full text-xs rounded border-slate-300 focus:ring-slate-500 focus:border-slate-500"
                                    >
                                        <option value="closed_door">Closed Door (Executive)</option>
                                        <option value="invitation_only">Invitation Only</option>
                                        <option value="public">Public Forum</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Capacity Limit
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={data.capacity}
                                        onChange={(e) => setData('capacity', parseInt(e.target.value) || 0)}
                                        className="w-full text-xs rounded border-slate-300 focus:ring-slate-500 focus:border-slate-500"
                                    />
                                </div>
                            </div>

                            <div className="pt-2">
                                <label className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        checked={data.chatham_house_rule}
                                        onChange={(e) => setData('chatham_house_rule', e.target.checked)}
                                        className="rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                                    />
                                    <span className="text-xs font-semibold text-slate-800">
                                        Enforce Chatham House Rule (Off-the-Record)
                                    </span>
                                </label>
                                <p className="text-[11px] text-slate-500 ml-5 mt-0.5">
                                    Participants are free to use information received, but neither identity nor affiliation of speakers may be revealed.
                                </p>
                            </div>

                            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsScheduleModalOpen(false)}
                                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded shadow-xs transition"
                                >
                                    {processing ? 'Scheduling...' : 'Confirm Salon'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
