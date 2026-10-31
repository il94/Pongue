/// <reference types="vite/client" />

interface Window {
	umami?: {
		track: (eventName: string, eventData?: Record<string, unknown>) => void
	}
}
