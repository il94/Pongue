import { trackEvent } from "../../../lib/analytics"
import {
	ChangeEvent,
	FormEvent,
	useContext,
	useState
} from "react"
import axios, { AxiosError } from "axios"

import {
	Style
} from "./style"

import Button from "../../../componentsLibrary/Button"
import InputText from "../../../componentsLibrary/InputText"
import {
	ErrorMessage,
	VerticalSetting,
	VerticalSettingsForm,
	VerticalSettingWrapper
} from "../../../componentsLibrary/SettingsForm/Index"

import InteractionContext from "../../../contexts/InteractionContext"
import AuthContext from "../../../contexts/AuthContext"
import DisplayContext from "../../../contexts/DisplayContext"

import {
	ErrorResponse,
	SettingData,
	UserAuthenticate
} from "../../../utils/types"

function LockedInterface() {

	const { token, url } = useContext(AuthContext)!
	const { userAuthenticate, setUserAuthenticate, channelTarget, setChannelTarget } = useContext(InteractionContext)!
	const { displayPopupError } = useContext(DisplayContext)!

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		try {
			event.preventDefault()
			if (!channelTarget)
				throw new Error

			if (password.value.length === 0) {
				setPassword({
					value: '',
					error: true,
					errorMessage: "Insert password",
				})
				return
			}

			if (password.error)
				return

			await axios.post(`${url}/channel/${channelTarget.id}/join`, {
				hash: password.value
			},
			{
				headers: {
					'Authorization': `Bearer ${token}`
				}
			})

			trackEvent("channel-join")

			setUserAuthenticate((prevState: UserAuthenticate) => ({
				...prevState,
				channels: [...prevState.channels, channelTarget]
			}))

			setChannelTarget(() => ({
				...channelTarget,
				members: [...channelTarget.members, userAuthenticate]
			}))
		}
		catch (error) {
			if (axios.isAxiosError(error)) {
				const axiosError = error as AxiosError<ErrorResponse>
				const { statusCode, message } = axiosError.response?.data!
				if (statusCode === 403 || statusCode === 404 || statusCode === 409)
					displayPopupError({ display: true, message: message })
				else
					displayPopupError({ display: true })
			}
			else
				displayPopupError({ display: true })
		}
	}

	/* ============================== PASSWORD ================================== */

	const [password, setPassword] = useState<SettingData>({
		value: '',
		error: false,
		errorMessage: ''
	})

	function handleInputPasswordChange(event: ChangeEvent<HTMLInputElement>) {
		const value = event.target.value
		setPassword({
			value: value,
			error: false
		})
	}

	function handleInputPasswordBlur() {
		setPassword((prevState: SettingData) => ({
			...prevState,
			error: false
		}))
	}

	/* ========================================================================== */

	return (
		<Style>
			<div style={{ height: "75%" }}>
				<VerticalSettingsForm
					onSubmit={handleSubmit}
					autoComplete="off"
					spellCheck="false">
					<VerticalSetting fontSize={22} height={"100%"} >
						Password
						<VerticalSettingWrapper>
							<InputText
								onChange={handleInputPasswordChange}
								onBlur={handleInputPasswordBlur}
								value={password.value as string}
								width={200}
								$error={password.error} />
							<ErrorMessage>
								{password.error && password.errorMessage}
							</ErrorMessage>
						</VerticalSettingWrapper>
					</VerticalSetting>
					<Button
						type="submit" width={200}
						alt="Submit button" title="Submit">
						Submit
					</Button>
				</VerticalSettingsForm>
			</div>
		</Style>
	)
}

export default LockedInterface