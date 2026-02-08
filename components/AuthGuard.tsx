// src/components/AuthGuard.tsx
'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import axios from 'axios';
import { apiUrl } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export const AuthGuard = ({ children }: { children: React.ReactNode }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const pathname = usePathname();
    const setAuth = useAuthStore((state) => state.setAuth);

    useEffect(() => {
        const verifyAuth = async () => {
            setError(null);
            const token = localStorage.getItem('token');
            const storedRole = localStorage.getItem('role'); // "student" | "admin"

            if (!token) {
                router.replace('/auth/login');
                return;
            }

            try {
                // OPTIMIZATION: Check stored role first to avoid unnecessary 403s
                if (pathname.startsWith('/admin')) {
                    // if we think we are a student, verify as student first
                    if (storedRole === 'student') {
                        try {
                            const userRes = await axios.get(`${apiUrl}/auth/user/me`, {
                                headers: { 'Authorization': `Bearer ${token}` }
                            });
                            if (userRes.data.success) {
                                setAuth({ user: userRes.data.data, admin: undefined, role: "student" });
                                localStorage.setItem('role', 'student'); // FORCE SYNC
                                router.replace('/student/events');
                                return;
                            }
                        } catch (ignore) {
                            // Fallback to normal check if optimization fails
                        }
                    }

                    // Otherwise try admin verification
                    const response = await axios.get(`${apiUrl}/auth/admin/me`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });

                    if (response.data.success) {
                        setAuth({ admin: response.data.data, user: undefined, role: "admin" });
                        localStorage.setItem('role', 'admin'); // FORCE SYNC
                        setIsLoading(false);
                    } else {
                        throw new Error('Verification failed');
                    }
                } else if (pathname.startsWith('/student')) {
                    // if we think we are an admin, verify as admin first
                    if (storedRole === 'admin') {
                        try {
                            const adminRes = await axios.get(`${apiUrl}/auth/admin/me`, {
                                headers: { 'Authorization': `Bearer ${token}` }
                            });
                            if (adminRes.data.success) {
                                setAuth({ admin: adminRes.data.data, user: undefined, role: "admin" });
                                localStorage.setItem('role', 'admin'); // FORCE SYNC
                                router.replace('/admin/dashboard');
                                return;
                            }
                        } catch (ignore) {
                            // Fallback to normal check if optimization fails
                        }
                    }

                    // Otherwise try student verification
                    const response = await axios.get(`${apiUrl}/auth/user/me`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });

                    if (response.data.success) {
                        setAuth({ user: response.data.data, admin: undefined, role: "student" });
                        localStorage.setItem('role', 'student'); // FORCE SYNC
                        setIsLoading(false);
                    } else {
                        throw new Error('Verification failed');
                    }
                } else {
                    // For non-protected routes or handle otherwise
                    setIsLoading(false);
                }
            } catch (err: any) {
                const status = err.response?.status;

                // 1. Handle 401 Unauthorized -> Invalid Token -> Logout
                if (status === 401) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('role');
                    localStorage.removeItem('userId');
                    router.replace('/auth/login');
                    return;
                }

                // 2. Handle 403 Forbidden -> Wrong Role -> Try to recover
                if (status === 403) {
                    try {
                        // If we started on Student route and failed 403, check if we are actually an Admin
                        if (pathname.startsWith('/student')) {
                            const adminRes = await axios.get(`${apiUrl}/auth/admin/me`, {
                                headers: { 'Authorization': `Bearer ${token}` }
                            });
                            if (adminRes.data.success) {
                                setAuth({ admin: adminRes.data.data, user: undefined, role: "admin" });
                                localStorage.setItem('role', 'admin');
                                router.replace('/admin/dashboard');
                                return;
                            }
                        }
                        // If we started on Admin route and failed 403, check if we are actually a Student
                        else if (pathname.startsWith('/admin')) {
                            const userRes = await axios.get(`${apiUrl}/auth/user/me`, {
                                headers: { 'Authorization': `Bearer ${token}` }
                            });
                            if (userRes.data.success) {
                                setAuth({ user: userRes.data.data, admin: undefined, role: "student" });
                                localStorage.setItem('role', 'student');
                                router.replace('/student/events');
                                return;
                            }
                        }
                    } catch (crossCheckErr) {
                        // Cross-check failed too. Logout.
                        localStorage.removeItem('token');
                        localStorage.removeItem('role');
                        localStorage.removeItem('userId');
                        router.replace('/auth/login');
                        return;
                    }
                }

                // 3. Handle Other Errors (500, Network Error) -> SHOW ERROR STATE
                console.error("AuthGuard Error:", err);
                setError("Authentication failed. Please check your connection or try again.");
                setIsLoading(false);
            }
        };

        verifyAuth();
    }, [pathname, router, setAuth]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
                <h2 className="text-xl font-semibold text-red-600 mb-2">Access Error</h2>
                <p className="text-gray-600 mb-4">{error}</p>
                <button
                    onClick={() => {
                        setIsLoading(true);
                        setError(null);
                        // Force re-run of effect by toggling loading, 
                        // effectively we just want to trigger a re-render or re-mount logic, 
                        // but specifically triggering the verifyAuth again is key.
                        // Since verifyAuth is inside useEffect, we can trigger a reload:
                        window.location.reload();
                    }}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                >
                    Retry
                </button>
            </div>
        );
    }

    return <>{children}</>;
};
