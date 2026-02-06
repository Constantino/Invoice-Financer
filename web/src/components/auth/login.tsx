import { useLogin, usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useUserStore } from '@/stores/userStore';

export default function Login() {
    const { ready, authenticated } = usePrivy();
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const { login: setLoggedIn } = useUserStore();

    const { login } = useLogin({
        onComplete: ({ user, isNewUser, loginMethod }) => {
            console.log('User logged in successfully', user);
            console.log('Is new user:', isNewUser);
            console.log('Login method:', loginMethod);

            // Update Zustand store
            setLoggedIn({
                id: user.id,
                email: user.email?.address
            });

            router.push('/borrowers/loans');
        },
        onError: (error) => {
            console.error('Login failed', error);
            setError('Login failed. Please try again.');
        }
    });

    const disableLogin = !ready || (ready && authenticated);

    const handleLogin = () => {
        setError(null);
        login();
    };

    // Don't show anything if user is already authenticated
    if (authenticated) {
        return null;
    }

    return (
        <div className="flex flex-col items-center gap-2">
            <button
                disabled={disableLogin}
                onClick={handleLogin}
                className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50 min-w-3xs"
            >
                Log in
            </button>
            {error && (
                <p className="text-red-500 text-sm">{error}</p>
            )}
        </div>
    );
}
