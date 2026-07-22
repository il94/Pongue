declare module '*.png';
declare module '*.webp';

interface ImportMetaEnv {
	readonly VITE_DEMO_ENABLED?: string,
	readonly VITE_DEMO_USERNAMES?: string,
	readonly VITE_DEMO_PASSWORD?: string
}

interface ImportMeta {
	readonly env: ImportMetaEnv
}
