import {
	Dispatch,
	SetStateAction
} from "react"

import {
	Message,
	Style
} from "./style"

import CloseButton from "../../componentsLibrary/CloseButton"
import Button from "../../componentsLibrary/Button"

export const DEMO_WELCOME_STORAGE_KEY = "pongue-demo-welcome-seen"

type PropsDemoWelcomeMenu = {
	displayDemoWelcomeMenu: Dispatch<SetStateAction<boolean>>
}

function DemoWelcomeMenu({ displayDemoWelcomeMenu }: PropsDemoWelcomeMenu) {

	function handleClose() {
		sessionStorage.setItem(DEMO_WELCOME_STORAGE_KEY, "true")
		displayDemoWelcomeMenu(false)
	}

	return (
		<Style>
			<CloseButton closeFunctionAlt={handleClose} />
			<div style={{ height: "5px" }} />
			<Message>
				You're playing on the shared demo account, so you can jump straight into a game without signing up.
			</Message>
			<Message>
				Settings are disabled here : username, password, avatar and 2FA can't be changed, since the account is shared with the next visitor.
			</Message>
			<Message>
				Everything else is fully playable : challenge the other demo players, chat and try a game.
			</Message>
			<div style={{ height: "10px" }} />
			<Button
				onClick={handleClose}
				fontSize={"20px"}
				alt="Close demo welcome button" title="Have a look around">
				Have a look around
			</Button>
		</Style>
	)
}

export default DemoWelcomeMenu
