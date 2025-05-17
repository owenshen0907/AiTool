// hooks/useCurrentUser.ts
import useSWR from 'swr';

interface ApiUser {
    name: string;
    displayName?: string;
    avatar?: string;
}

interface UserResponse {
    loggedIn: boolean;
    user?: ApiUser;
    model_list?: any[];
}

const fetcher = (url: string) =>
    fetch(url, { credentials: 'include' })
        .then((res) => res.json() as Promise<UserResponse>);

/**
 * Hook to get current user via SWR.
 * - data.user: ApiUser if logged in, undefined otherwise
 * - data.model_list: array of models
 * - error: any fetch error
 * - mutate: revalidate or update the cache
 */
export function useCurrentUser() {
    const { data, error, mutate } = useSWR<UserResponse>('/api/user/get', fetcher, {
        revalidateOnFocus: false,
        dedupingInterval: 60000, // 1 minute
    });

    return {
        user: data?.user,
        models: data?.model_list || [],
        isLoading: !error && !data,
        isError: !!error,
        mutate,
    };
}