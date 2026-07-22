type DemoAccount = {
	username: string,
	password: string
}

export const demoEnabled = import.meta.env.VITE_DEMO_ENABLED !== "false"

export const demoAccounts: DemoAccount[] = (import.meta.env.VITE_DEMO_USERNAMES ?? "demo1,demo2")
	.split(',')
	.map((username: string) => ({
		username: username.trim(),
		password: import.meta.env.VITE_DEMO_PASSWORD ?? "Demo1234!"
	}))

export function isDemoUser(username: string) {
	return demoAccounts.some((account: DemoAccount) => account.username === username)
}
