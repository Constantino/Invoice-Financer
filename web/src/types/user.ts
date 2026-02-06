export interface User {
    id?: string;
    email?: string;
    name?: string;
}

export interface UserState {
    isLoggedIn: boolean;
    user: User | null;
    login: (user?: User) => void;
    logout: () => void;
}
