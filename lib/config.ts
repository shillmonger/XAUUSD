export const getAppUrl = (): string => {
  // Use NEXTAUTH_URL for local development, NEXT_PUBLIC_APP_URL for production
  if (process.env.NODE_ENV === 'development' && process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL;
  }
  return process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
};