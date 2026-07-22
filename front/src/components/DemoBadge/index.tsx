import { IlandolsDemoBadge } from "ilandols-demo-badge/react"

import {
	demoAccounts,
	demoEnabled
} from "../../utils/demo"

function DemoBadge() {

	if (!demoEnabled)
		return null

	const credentials = demoAccounts.map((account, index) => ({
		label: `Player ${index + 1}`,
		credentials: [
			{ label: "Username", value: account.username },
			{ label: "Password", value: account.password }
		]
	}))

	return (
		<IlandolsDemoBadge
			heading="Try Pongue instantly"
			description="No sign up, no 42 account : log in with either account below and jump straight into a game. Take one each and you can play against a friend."
			credentials={credentials}
		/>
	)
}

export default DemoBadge
