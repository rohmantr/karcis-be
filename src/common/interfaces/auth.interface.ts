export interface TokenPair {
    accessToken: string;
    refreshToken: string;
}

export interface RefreshTokenPayload {
    sub: string;
    email: string;
    role: string;
}
