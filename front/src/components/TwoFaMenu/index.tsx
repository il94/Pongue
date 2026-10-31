import { trackEvent } from "../../lib/analytics"
import {
	ChangeEvent,
	Dispatch,
	FormEvent,
	SetStateAction,
	useContext,
	useEffect,
	useRef,
	useState
} from "react"
import axios, { AxiosError, AxiosResponse } from "axios"

import {
	Message,
	QRCode,
	QRCodeWrapper,
	Style
} from "./style"

import InputText from "../../componentsLibrary/InputText"
import CloseButton from "../../componentsLibrary/CloseButton"
import Loader from "../../componentsLibrary/Loader"
import {
	ErrorMessage,
	VerticalSetting,
	VerticalSettingsForm,
	VerticalSettingWrapper
} from "../../componentsLibrary/SettingsForm/Index"

import AuthContext from "../../contexts/AuthContext"
import InteractionContext from "../../contexts/InteractionContext"
import DisplayContext from "../../contexts/DisplayContext"

import {
	ErrorResponse,
	SettingData,
	UserAuthenticate
} from "../../utils/types"

import {
	emptySetting
} from "../../utils/emptyObjects"

type PropsTwoFaMenu = {
	displayTwoFAMenu: Dispatch<SetStateAction<boolean>>
}

function TwoFaMenu({ displayTwoFAMenu }: PropsTwoFaMenu) {

	const { token, url } = useContext(AuthContext)!
	const { userAuthenticate, setUserAuthenticate } = useContext(InteractionContext)!
	const { displayPopupError, zSettingsIndex } = useContext(DisplayContext)!

	/* =============================== SUBMIT =================================== */

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		try {
			event.preventDefault()
			if (!code.value) {
				setCode({
					value: '',
					error: true,
					errorMessage: "Insert code",
				})
				return
			}
			else if (code.value.length < 6) {
				setCode((prevState: SettingData) => ({
					...prevState,
					error: true,
					errorMessage: "Code must contains 6 digits"
				}))
				return
			}

			if (code.error)
				return

			if (!userAuthenticate.twoFA) {
				await axios.patch(`${url}/auth/2fa/enable`, {
					twoFACode: code.value
				},
				{
					headers: {
						'Authorization': `Bearer ${token}`
					}
				})
				trackEvent("2fa-enable")
				setUserAuthenticate((prevState: UserAuthenticate) => ({
					...prevState,
					twoFA: true
				}))
			}
			else {
				await axios.patch(`${url}/auth/2fa/disable`, {
					twoFACode: code.value
				},
				{
					headers: {
						'Authorization': `Bearer ${token}`
					}
				})
				trackEvent("2fa-disable")
				setUserAuthenticate((prevState: UserAuthenticate) => ({
					...prevState,
					twoFA: false
				}))
			}
			displayTwoFAMenu(false)
		}
		catch (error) {
			if (axios.isAxiosError(error)) {
				const axiosError = error as AxiosError<ErrorResponse>
				const { statusCode, message } = axiosError.response?.data!
				if (statusCode === 403)
				{
					setCode((prevState: SettingData) => ({
						...prevState,
						error: true,
						errorMessage: "Wrong code"
					}))
				}
				else if (statusCode === 404 || statusCode === 409)
				{
					displayPopupError({ display: true, message: message })
					displayTwoFAMenu(false)
				}
				else
				{
					displayPopupError({ display: true })
					displayTwoFAMenu(false)
				}
			}
			else
			{
				displayPopupError({ display: true })
				displayTwoFAMenu(false)
			}
		}
	}

	/* ============================== QR CODE =================================== */

	const [qrCode, setQRCode] = useState<string>('')
	const [loader, setLoader] = useState<boolean>(true)

	useEffect(() => {
		async function fetchTwoFAQRCode() {
			try {
				setLoader(true)
				const generateQRCodeResponse: AxiosResponse<string> = await axios.get(`${url}/auth/2fa/generate`, {
					headers: {
						'Authorization': `Bearer ${token}`
					}
				})

				setQRCode(generateQRCodeResponse.data)
				setLoader(false)
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
				displayTwoFAMenu(false)
			}
		}

		if (!userAuthenticate.twoFA)
			fetchTwoFAQRCode()

		const InputCodeContainer = inputCodeRef.current
		if (InputCodeContainer)
			InputCodeContainer.focus()
	}, [])

	/* ================================ CODE ==================================== */

	const [code, setCode] = useState<SettingData>(emptySetting)

	function handleInputCode(event: ChangeEvent<HTMLInputElement>) {
		const value = event.target.value
		if (value.length === 0) {
			setCode({
				value: value,
				error: true,
				errorMessage: "Code cannot be empty"
			})
		}
		else if (value.length > 6) {
			setCode((prevState: SettingData) => ({
				...prevState,
				error: true,
				errorMessage: "Code must contains 6 digits"
			}))
		}
		else if (!/\d/.test(value)) {
			setCode((prevState: SettingData) => ({
				...prevState,
				error: true,
				errorMessage: "Code must be containing by digits",
			}))
		}
		else {
			setCode({
				value: value,
				error: false
			})
		}
	}

	function handleInputCodeBlur() {
		setCode((prevState: SettingData) => ({
			...prevState,
			error: false
		}))
	}

	const inputCodeRef = useRef<HTMLInputElement>(null)

	useEffect(() => {
		const InputCodeContainer = inputCodeRef.current
		if (InputCodeContainer)
			InputCodeContainer.focus()
	})

	/* ========================================================================== */

	return (
		<Style $zIndex={zSettingsIndex}>
			<CloseButton closeFunction={displayTwoFAMenu} />
			<VerticalSettingsForm
				onSubmit={handleSubmit}
				autoComplete="off"
				spellCheck="false">
				<VerticalSetting>
					{
						!userAuthenticate.twoFA ?
							<>
								<QRCodeWrapper>
									{
										loader ?
											<Loader size={150} />
											:
											<QRCode src={qrCode} />
									}
								</QRCodeWrapper>
								<Message>
									Scan the QRcode and enter the six-digit code from Google Authenticator to enable double authentication
								</Message>
							</>
							:
							<Message>
								Enter the six-digit code from Google Authenticator to disable double authentication
							</Message>
					}
					<VerticalSettingWrapper>
						<InputText
							onChange={handleInputCode}
							onBlur={handleInputCodeBlur}
							type="text" value={code.value}
							width={150}
							fontSize={25}
							$error={code.error}
							ref={inputCodeRef} />
						<ErrorMessage>
							{code.error && code.errorMessage}
						</ErrorMessage>
					</VerticalSettingWrapper>
				</VerticalSetting>
			</VerticalSettingsForm>
		</Style>
	)
}

export default TwoFaMenu