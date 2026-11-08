import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps, Scholar } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

interface ScholarsIndexProps extends PageProps {
    scholars: Scholar[];
    all_tags: string[];
    filters: {
        search: string;
        tag: string;
    };
}

export default function ScholarsIndex({
    scholars,
    all_tags,
    filters,
}: ScholarsIndexProps) {
    const [isAppointModalOpen, setIsAppointModalOpen] = useState(false);
    const [tagInput, setTagInput] = useState('');

    const { data, setData, post, processing, reset, errors } = useForm({
        first_name: '',
        last_name: '',
        title: '',
        bio: '',
        expertise_tags: [] as string[],
    });

    const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        router.get(
            route('scholars.index'),
            { search: formData.get('search') as string, tag: filters.tag },
            { preserveState: true }
        );
    };

    const handleTagFilter = (tag: string) => {
        const nextTag = filters.tag === tag ? '' : tag;
        router.get(
            route('scholars.index'),
            { search: filters.search, tag: nextTag },
            { preserveState: true }
        );
    };

    const addTag = () => {
        if (tagInput.trim() && !data.expertise_tags.includes(tagInput.trim())) {
            setData('expertise_tags', [...data.expertise_tags, tagInput.trim()]);
            setTagInput('');
        }
    };

    const removeTag = (tagToRemove: string) => {
        setData(
            'expertise_tags',
            data.expertise_tags.filter((t) => t !== tagToRemove)
        );
    };

    const submitAppoint: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('scholars.store'), {
            onSuccess: () => {
                setIsAppointModalOpen(false);
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
                            The Talent Matrix
                        </h1>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Directory of resident fellows, visiting scholars, and institutional research faculty.
                        </p>
                    </div>
                    <button
                        onClick={() => setIsAppointModalOpen(true)}
                        className="inline-flex items-center px-3.5 py-1.5 rounded-md bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition shadow-xs"
                    >
                        + Appoint Fellow
                    </button>
                </div>
            }
        >
            <Head title="Talent Matrix" />

            <div className="space-y-6">
                {/* Search & Tag Taxonomy Filter */}
                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs space-y-4">
                    <form onSubmit={handleSearch} className="flex gap-3">
                        <input
                            type="text"
                            name="search"
                            defaultValue={filters.search}
                            placeholder="Search by scholar name or institutional title..."
                            className="flex-1 rounded-md border-slate-300 text-xs focus:border-slate-500 focus:ring-slate-500 shadow-xs placeholder:text-slate-400"
                        />
                        <button
                            type="submit"
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-md transition"
                        >
                            Filter
                        </button>
                    </form>

                    {all_tags.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
                            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">
                                Expertise Taxonomies:
                            </span>
                            {all_tags.map((tag) => (
                                <button
                                    key={tag}
                                    onClick={() => handleTagFilter(tag)}
                                    className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                                        filters.tag === tag
                                            ? 'bg-slate-900 text-white shadow-xs'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                                    }`}
                                >
                                    {tag}
                                </button>
                            ))}
                            {filters.tag && (
                                <button
                                    onClick={() => handleTagFilter('')}
                                    className="text-xs text-rose-600 hover:underline ml-2 font-medium"
                                >
                                    Clear filter
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Scholar Roster Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {scholars.length === 0 ? (
                        <div className="col-span-full bg-white p-12 text-center rounded-lg border border-slate-200">
                            <p className="text-xs text-slate-500">
                                No scholars match the current filter query.
                            </p>
                        </div>
                    ) : (
                        scholars.map((scholar) => (
                            <div
                                key={scholar.id}
                                className="bg-white rounded-lg border border-slate-200 p-6 flex flex-col justify-between hover:border-slate-300 transition shadow-xs"
                            >
                                <div className="space-y-3">
                                    <div className="flex items-start justify-between">
                                        <div className="h-10 w-10 rounded-full bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center font-bold text-sm">
                                            {scholar.first_name[0]}
                                            {scholar.last_name[0]}
                                        </div>
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                                            Active
                                        </span>
                                    </div>

                                    <div>
                                        <h3 className="text-base font-bold text-slate-900 leading-snug">
                                            {scholar.name}
                                        </h3>
                                        <p className="text-xs font-medium text-slate-500 mt-0.5">
                                            {scholar.title}
                                        </p>
                                    </div>

                                    {scholar.bio && (
                                        <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                                            {scholar.bio}
                                        </p>
                                    )}
                                </div>

                                <div className="mt-5 pt-4 border-t border-slate-100">
                                    <div className="flex flex-wrap gap-1">
                                        {scholar.expertise_tags.map((tag) => (
                                            <span
                                                key={tag}
                                                className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Appoint Fellow Modal */}
            {isAppointModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-base font-bold text-slate-900">
                                Appoint Institutional Scholar / Fellow
                            </h2>
                            <button
                                onClick={() => setIsAppointModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={submitAppoint} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        First Name
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={data.first_name}
                                        onChange={(e) => setData('first_name', e.target.value)}
                                        className="w-full text-xs rounded border-slate-300 focus:ring-slate-500 focus:border-slate-500"
                                    />
                                    {errors.first_name && (
                                        <p className="text-rose-600 text-[11px] mt-1">{errors.first_name}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Last Name
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={data.last_name}
                                        onChange={(e) => setData('last_name', e.target.value)}
                                        className="w-full text-xs rounded border-slate-300 focus:ring-slate-500 focus:border-slate-500"
                                    />
                                    {errors.last_name && (
                                        <p className="text-rose-600 text-[11px] mt-1">{errors.last_name}</p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Institutional Title
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Senior Fellow, National Security & Emerging Tech"
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
                                    Biographical Summary
                                </label>
                                <textarea
                                    rows={3}
                                    value={data.bio}
                                    onChange={(e) => setData('bio', e.target.value)}
                                    placeholder="Prior diplomatic/academic background, core research vectors..."
                                    className="w-full text-xs rounded border-slate-300 focus:ring-slate-500 focus:border-slate-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Expertise Taxonomies
                                </label>
                                <div className="flex gap-2 mb-2">
                                    <input
                                        type="text"
                                        value={tagInput}
                                        onChange={(e) => setTagInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                addTag();
                                            }
                                        }}
                                        placeholder="Add tag (e.g. Indo-Pacific) and press Add"
                                        className="flex-1 text-xs rounded border-slate-300 focus:ring-slate-500 focus:border-slate-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={addTag}
                                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded"
                                    >
                                        Add
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {data.expertise_tags.map((tag) => (
                                        <span
                                            key={tag}
                                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-700 font-medium"
                                        >
                                            {tag}
                                            <button
                                                type="button"
                                                onClick={() => removeTag(tag)}
                                                className="text-slate-400 hover:text-slate-600"
                                            >
                                                ✕
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsAppointModalOpen(false)}
                                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded shadow-xs transition"
                                >
                                    {processing ? 'Establishing...' : 'Confirm Appointment'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
