interface AppEnv {
  apiUrl: string;
}

const apiUrl = import.meta.env.VITE_API_URL ?? '/api/v1';

export const env: AppEnv = {
  apiUrl,
};
