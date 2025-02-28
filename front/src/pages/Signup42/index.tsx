import {
	ChangeEvent,
	FormEvent,
	useContext,
	useEffect,
	useState
} from 'react'
import axios, { AxiosError, AxiosResponse } from 'axios'
import {
	useNavigate
} from 'react-router'
import Cookies from 'js-cookie'

import StyledLink from '../../componentsLibrary/StyledLink/Index'
import Button from '../../componentsLibrary/Button'
import InputText from '../../componentsLibrary/InputText'
import Page from '../../componentsLibrary/Page'
import MainTitle from '../../componentsLibrary/MainTitle'
import CentralWindow from '../../componentsLibrary/CentralWindow'
import WindowTitle from '../../componentsLibrary/WindowTitle'
import {
	VerticalSettingsForm,
	VerticalSetting,
	ErrorMessage,
	VerticalSettingWrapper
} from '../../componentsLibrary/SettingsForm/Index'

import AuthContext from '../../contexts/AuthContext'

import {
	ErrorResponse,
	SettingAvatar,
	SettingData
} from '../../utils/types'

import {
	emptySetting
} from '../../utils/emptyObjects'

import colors from '../../utils/colors'
import SelectAvatar from '../../components/SelectAvatar'
import styled from 'styled-components'

import FTIcon from '../../assets/42.png'

type PropsSignupResponse = {
	access_token: string
}

const FTImage = styled.img`
	
	position: absolute;
	top: 5px;
	left: 7.5px;

	width: 50px;
	height: 38px;

	&:hover {
		transform: scale(1.05);
	}

`

function SignupFT() {

	const { token, url } = useContext(AuthContext)!
	const navigate = useNavigate()

	const usernameId = Cookies.get('usernameId')
	const avatarCookie = Cookies.get('avatar')
	
	const [FTAvatar, setFTAvatar] = useState<File | undefined>()

	useEffect(() => {
		if (token)
			navigate("/error", {
				state: {
					message: "You are already authenticate",
					keepConnect: true
				}
			})
		else if (!usernameId || !avatarCookie)
			navigate("/error")

		async function fetch42Avatar() {
			try {
				const response42Avatar = await axios.get(`${avatarCookie}`, {
					responseType: 'blob',
				})

				const blob = response42Avatar.data

				const image42 = new File([blob], '42.jpg', { type: blob.type })
				setFTAvatar(image42)

			}
			catch (error) {
				navigate("/error")
			}
		}

		fetch42Avatar()
	}, [])

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		try {
			event.preventDefault()
			if (!username.value) {
				setUsername({
					value: '',
					error: true,
					errorMessage: "Insert username",
				})
				return
			}
			if (!password.value) {
				setPassword({
					value: '',
					error: true,
					errorMessage: "Insert password",
				})
				return
			}
			if (username.error || password.error)
				return

			const newUser = {
				usernameId: usernameId,
				username: username.value,
				hash: password.value,
			}

			const multiPartBody: FormData = new FormData()
			if (avatar.toUpload)
				multiPartBody.append('file', avatar.toUpload)
			else if (FTAvatar)
				multiPartBody.append('file', FTAvatar)
			multiPartBody.append('newUser', JSON.stringify(newUser))

			const signupResponse: AxiosResponse<PropsSignupResponse> = await axios.post(`${url}/auth/signup`, multiPartBody,
			{
				headers: {
					'Content-Type': 'multipart/form-data'
				}
			})

			localStorage.setItem("access_token", signupResponse.data.access_token)

			navigate("/")
		}
		catch (error) {
			if (axios.isAxiosError(error)) {
				const axiosError = error as AxiosError<ErrorResponse>
				const { statusCode, message } = axiosError.response?.data!
				if (statusCode === 409) {
					setUsername((prevState) => ({
						...prevState,
						error: true,
						errorMessage: message
					}))
				}
				else if (statusCode === 400 || statusCode === 403 || statusCode === 422) {
					navigate("/error", { state: {
						message: message
					}})
				}
				else
					navigate("/error")
			}
			else
				navigate("/error")
		}
	}

	/* ============================== USERNAME ================================== */

	const [username, setUsername] = useState<SettingData>(emptySetting)

	function handleInputUsernameChange(event: ChangeEvent<HTMLInputElement>) {
		const value = event.target.value
		if (!value) {
			setUsername({
				value: value,
				error: true,
				errorMessage: "Username cannot be empty"
			})
		}
		else if (value.length > 8) {
			setUsername((prevState: SettingData) => ({
				...prevState,
				error: true,
				errorMessage: "Username must not exceed 8 characters"
			}))
		}
		else if (/\d/.test(value)) {
			setUsername((prevState: SettingData) => ({
				...prevState,
				error: true,
				errorMessage: "Username must not contain digits",
			}))
		}
		else if (/[A-Z]/.test(value)) {
			setUsername((prevState: SettingData) => ({
				...prevState,
				error: true,
				errorMessage: "Username must not contain uppercase",
			}))
		}
		else if (!/^[a-z]+$/.test(value)) {
			setUsername((prevState: SettingData) => ({
				...prevState,
				error: true,
				errorMessage: "Username can't contain special characters",
			}))
		}
		else {
			setUsername({
				value: value,
				error: false
			})
		}
	}

	function handleInputUsernameBlur() {
		setUsername((prevState: SettingData) => ({
			...prevState,
			error: false
		}))
	}

	/* ============================== PASSWORD ================================== */

	const [password, setPassword] = useState<SettingData>(emptySetting)

	function handleInputPasswordChange(event: ChangeEvent<HTMLInputElement>) {
		const value = event.target.value

		if (value.length < 8 ||
			!/[A-Z]/.test(value) ||
			!/[a-z]/.test(value) ||
			!/\d/.test(value) ||
			!/[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]/.test(value)) {
			let errorMessages: string[] = []
			if (!value) {
				errorMessages.push("Password cannot be empty")
			}
			else if (value.length < 8) {
				errorMessages.push("Password must be at least 8 characters long")
			}
			if (!/[A-Z]/.test(value)) {
				errorMessages.push("Password must contain one uppercase")
			}
			if (!/[a-z]/.test(value)) {
				errorMessages.push("Password must contain one lowercase")
			}
			if (!/\d/.test(value)) {
				errorMessages.push("Password must contain one number")
			}
			if (!/[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]/.test(value)) {
				errorMessages.push("Password must contain one special character")
			}
			setPassword({
				value: value,
				error: true,
				errorMessage: errorMessages
			})
		}
		else {
			setPassword({
				value: value,
				error: false
			})
		}
	}

	const [showPassword, setShowPassword] = useState<boolean>(false)

	/* =============================== AVATAR ================================== */

	const [avatar, setAvatar] = useState<SettingAvatar>({
		toDisplay: avatarCookie!,
		toUpload: undefined,
		error: false
	})

	/* ========================================================================== */

	return (
		<Page>
			<MainTitle>
				<StyledLink to="/">
					Pongue
				</StyledLink>
			</MainTitle>
			<CentralWindow>
				<WindowTitle>
					Sign up
				</WindowTitle>
				<FTImage src={FTIcon} />
				<VerticalSettingsForm
					onSubmit={handleSubmit}
					autoComplete="off"
					spellCheck="false">
					<VerticalSetting fontSize={20}>
						Username
						<VerticalSettingWrapper>
							<InputText
								onChange={handleInputUsernameChange}
								onBlur={handleInputUsernameBlur}
								type="text" value={username.value}
								width={231}
								fontSize={25}
								$error={username.error} />
							<ErrorMessage>
								{username.error && username.errorMessage}
							</ErrorMessage>
						</VerticalSettingWrapper>
					</VerticalSetting>
					<VerticalSetting fontSize={20}>
						Password
						<VerticalSettingWrapper>
							<InputText
								onChange={handleInputPasswordChange}
								type={showPassword ? "text" : "password"}
								value={password.value as string}
								width={231}
								fontSize={25}
								$error={password.error} />
							{
								password.errorMessage ?
									<>
										{
											Array.isArray(password.errorMessage) ?
												<>
													{

														(password.errorMessage as string[]).map((errorMessage, index) => {
															return (
																<ErrorMessage
																	key={"signupErrorMessage" + index}>
																	{errorMessage}
																</ErrorMessage>)
														}
														)
													}
												</>
												:
												<ErrorMessage>
													{password.errorMessage}
												</ErrorMessage>
										}
									</>
									:
									<div style={{ height: "15px" }} />
							}
							<Button
								onClick={() => setShowPassword(!showPassword)}
								type="button" fontSize={"18px"}
								alt="Show password button"
								title={showPassword ? "Hide password" : "Show password"}
								style={{ marginTop: "2.5px", marginBottom: "15px" }} >
								{
									showPassword ?
										"Hide password"
										:
										"Show password"
								}
							</Button>
						</VerticalSettingWrapper>
					</VerticalSetting>
						<VerticalSetting>
							<SelectAvatar
								avatar={avatar}
								setAvatar={setAvatar}
								navigate={navigate} />
						</VerticalSetting>
					<div style={{ height: "10px" }} />
					<Button
						type="submit" fontSize={"35px"}
						alt="Continue button" title="Continue">
						Continue
					</Button>
				</VerticalSettingsForm>
				<div>
					Already have an account ?&nbsp;
					<StyledLink to="/signin" color={colors.button}>
						Sign in
					</StyledLink>
				</div>
				<div style={{ height: "15px" }} />
			</CentralWindow>
		</Page>
	)
}

export default SignupFT
