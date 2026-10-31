import { trackEvent } from "../../../../lib/analytics"
import {
	ChangeEvent,
	FocusEvent,
	FormEvent,
	useContext,
	useState
} from "react"
import axios, { AxiosError } from "axios"

import {
	Input,
	Style
} from "./style"

import InteractionContext from "../../../../contexts/InteractionContext"
import AuthContext from "../../../../contexts/AuthContext"
import DisplayContext from "../../../../contexts/DisplayContext"

import {
	ErrorResponse
} from "../../../../utils/types"

import {
	ChannelType,
	messageType
} from "../../../../utils/status"
 
function TextInput() {

	const { token, url } = useContext(AuthContext)!
	const { userAuthenticate, channelTarget } = useContext(InteractionContext)!
	const { displayPopupError } = useContext(DisplayContext)!

	const [message, setMessage] = useState<string>('')

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		if (!message)
			return
		try {
			if (!channelTarget)
				throw new Error

			if (new Date(channelTarget.muteInfo[userAuthenticate.id]) > new Date())
			{
				displayPopupError({ display: true, message: "You are muted from this channel" })
				return
			}

			await axios.post(`${url}/channel/${channelTarget.id}/message`, {
				msg: message,
				msgStatus : messageType.TEXT
			},
			{
				headers: {
					'Authorization': `Bearer ${token}`
				}
			})
			trackEvent(channelTarget.type === ChannelType.MP ? "dm-send" : "message-send")
		}
		catch (error) {
			if (axios.isAxiosError(error)) {
				const axiosError = error as AxiosError<ErrorResponse>
				const { statusCode, message } = axiosError.response?.data!
				if (statusCode === 403 || statusCode === 404)
					displayPopupError({ display: true, message: message })
				else
					displayPopupError({ display: true })
			}
			else
				displayPopupError({ display: true })
		}
		finally {
			setMessage('')
		}
	}

	function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
		const value = event.target.value
		if (value.length < 10000)
			setMessage(event.target.value)
	}

	function removePlaceHolder(event: FocusEvent<HTMLInputElement>) {
		event.target.placeholder = ""
	}

	function setPlaceHolder(event: FocusEvent<HTMLInputElement>) {
		if (event.target.placeholder === "")
			event.target.placeholder = "Type here..."
	}

	return (
		<Style
			onSubmit={handleSubmit}
			autoComplete="off"
			spellCheck="false"> 
			<Input
				onFocus={removePlaceHolder}
				onBlur={setPlaceHolder}
				onChange={handleInputChange}
				value={message}
				placeholder="Type here..." />
		</Style>
	)
}

export default TextInput