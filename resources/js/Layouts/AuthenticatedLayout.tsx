import Dropdown from '@/Components/Dropdown';
import NavLink from '@/Components/NavLink';
import ResponsiveNavLink from '@/Components/ResponsiveNavLink';
import { PageProps } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { PropsWithChildren, ReactNode, useState } from 'react';

export default function Authenticated({
    header,
    children,
}: PropsWithChildren<{ header?: ReactNode }>) {
    const { auth, flash } = usePage<PageProps>().props;
    const user = auth.user;
    const tenant = auth.tenant;
    const [showingNavigationDropdown, setShowingNavigationDropdown] = useState(false);

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
            {/* Top Navigation */}
            <nav className="border-b border-slate-200 bg-white sticky top-0 z-40 shadow-xs">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 justify-between">
                        <div className="flex items-center space-x-8">
                            {/* Brand & Active Tenant Badge */}
                            <div className="flex shrink-0 items-center space-x-3">
                                <Link href="/dashboard" className="flex items-center space-x-2.5 group">
                                    <div className="h-8 w-8 rounded-lg bg-slate-900 flex items-center justify-center text-white font-bold text-sm tracking-wider shadow-sm group-hover:bg-slate-800 transition">
                                        TT
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-semibold tracking-tight text-slate-900 text-sm leading-tight">
                                            ThinkTank OS
                                        </span>
                                        <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                                            Command Center
                                        </span>
                                    </div>
                                </Link>

                                {tenant && (
                                    <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 bg-slate-100 border border-slate-200/80 rounded-md text-xs font-medium text-slate-700">
                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
                                        <span className="truncate max-w-[200px]">{tenant.name}</span>
                                    </div>
                                )}
                            </div>

                            {/* Main Nav Links */}
                            <div className="hidden space-x-6 sm:-my-px sm:flex h-full">
                                <NavLink
                                    href={route('dashboard')}
                                    active={route().current('dashboard')}
                                    className="text-xs uppercase tracking-wider font-semibold border-b-2"
                                >
                                    Dashboard
                                </NavLink>
                                <NavLink
                                    href={route('scholars.index')}
                                    active={route().current('scholars.*')}
                                    className="text-xs uppercase tracking-wider font-semibold border-b-2"
                                >
                                    Talent Matrix
                                </NavLink>
                                <NavLink
                                    href={route('publications.index')}
                                    active={route().current('publications.*')}
                                    className="text-xs uppercase tracking-wider font-semibold border-b-2"
                                >
                                    Publishing Engine
                                </NavLink>
                                <NavLink
                                    href={route('events.index')}
                                    active={route().current('events.*')}
                                    className="text-xs uppercase tracking-wider font-semibold border-b-2"
                                >
                                    Salons & Events
                                </NavLink>
                            </div>
                        </div>

                        {/* Right: Role indicator & User Menu */}
                        <div className="hidden sm:ms-6 sm:flex sm:items-center space-x-4">
                            {auth.role && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                                    {auth.role}
                                </span>
                            )}

                            <div className="relative">
                                <Dropdown>
                                    <Dropdown.Trigger>
                                        <button
                                            type="button"
                                            className="inline-flex items-center rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none"
                                        >
                                            <span>{user?.name ?? 'Account'}</span>
                                            <svg
                                                className="ms-1.5 h-3.5 w-3.5 text-slate-400"
                                                xmlns="http://www.w3.org/2000/svg"
                                                viewBox="0 0 20 20"
                                                fill="currentColor"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                        </button>
                                    </Dropdown.Trigger>

                                    <Dropdown.Content>
                                        <div className="px-4 py-2 border-b border-slate-100 text-xs text-slate-500">
                                            Signed in as <strong className="text-slate-800">{user?.email}</strong>
                                        </div>
                                        <Dropdown.Link href={route('profile.edit')}>
                                            Profile Settings
                                        </Dropdown.Link>
                                        <Dropdown.Link href={route('logout')} method="post" as="button">
                                            Log Out
                                        </Dropdown.Link>
                                    </Dropdown.Content>
                                </Dropdown>
                            </div>
                        </div>

                        {/* Mobile Hamburger */}
                        <div className="-me-2 flex items-center sm:hidden">
                            <button
                                onClick={() => setShowingNavigationDropdown((prev) => !prev)}
                                className="inline-flex items-center justify-center rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-500 focus:outline-none"
                            >
                                <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                                    <path
                                        className={!showingNavigationDropdown ? 'inline-flex' : 'hidden'}
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M4 6h16M4 12h16M4 18h16"
                                    />
                                    <path
                                        className={showingNavigationDropdown ? 'inline-flex' : 'hidden'}
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Responsive Navigation */}
                <div className={(showingNavigationDropdown ? 'block' : 'hidden') + ' sm:hidden border-b border-slate-200'}>
                    <div className="space-y-1 pb-3 pt-2">
                        <ResponsiveNavLink href={route('dashboard')} active={route().current('dashboard')}>
                            Dashboard
                        </ResponsiveNavLink>
                        <ResponsiveNavLink href={route('scholars.index')} active={route().current('scholars.*')}>
                            Talent Matrix
                        </ResponsiveNavLink>
                        <ResponsiveNavLink href={route('publications.index')} active={route().current('publications.*')}>
                            Publishing Engine
                        </ResponsiveNavLink>
                        <ResponsiveNavLink href={route('events.index')} active={route().current('events.*')}>
                            Salons & Events
                        </ResponsiveNavLink>
                    </div>

                    <div className="border-t border-slate-200 pb-3 pt-4">
                        <div className="px-4">
                            <div className="text-base font-medium text-slate-800">{user?.name}</div>
                            <div className="text-sm font-medium text-slate-500">{user?.email}</div>
                        </div>

                        <div className="mt-3 space-y-1">
                            <ResponsiveNavLink href={route('profile.edit')}>Profile</ResponsiveNavLink>
                            <ResponsiveNavLink method="post" href={route('logout')} as="button">
                                Log Out
                            </ResponsiveNavLink>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Flash Message Banner */}
            {flash?.success && (
                <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2.5 text-xs font-medium text-emerald-800">
                    <div className="max-w-7xl mx-auto flex items-center space-x-2">
                        <svg className="h-4 w-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        <span>{flash.success}</span>
                    </div>
                </div>
            )}

            {/* Page Header */}
            {header && (
                <header className="bg-white border-b border-slate-200">
                    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
                        {header}
                    </div>
                </header>
            )}

            {/* Main Content Workspace */}
            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                {children}
            </main>
        </div>
    );
}
