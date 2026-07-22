type DemoAccount = {
	username: string,
	password: string
}

const usernames = (import.meta.env.VITE_DEMO_USERNAMES ?? '')
	.split(',')
	.map((username: string) => username.trim())
	.filter((username: string) => username.length !== 0)

const password = import.meta.env.VITE_DEMO_PASSWORD ?? ''

export const demoAccounts: DemoAccount[] = usernames.map((username: string) => ({
	username: username,
	password: password
}))

// Sans identifiants a afficher, le badge n'aurait aucun interet
export const demoEnabled = import.meta.env.VITE_DEMO_ENABLED !== "false"
	&& demoAccounts.length !== 0
	&& password.length !== 0

export function isDemoUser(username: string) {
	return demoAccounts.some((account: DemoAccount) => account.username === username)
}
