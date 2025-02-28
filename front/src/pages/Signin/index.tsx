import {
	ChangeEvent,
	FormEvent,
	useContext,
	useEffect,
	useState
} from 'react'
import {
	useNavigate
} from 'react-router'
import axios, { AxiosError, AxiosResponse } from 'axios'

import styled from 'styled-components'

import StyledLink from '../../componentsLibrary/StyledLink/Index'
import Button from '../../componentsLibrary/Button'
import LinkButtonImage from '../../componentsLibrary/LinkButtonImage'
import InputText from '../../componentsLibrary/InputText'
import Page from '../../componentsLibrary/Page'
import MainTitle from '../../componentsLibrary/MainTitle'
import CentralWindow from '../../componentsLibrary/CentralWindow'
import WindowTitle from '../../componentsLibrary/WindowTitle'
import Separator from '../../componentsLibrary/Separator/Index'
import {
	VerticalSettingsForm,
	VerticalSetting,
	ErrorMessage,
	VerticalSettingWrapper
} from '../../componentsLibrary/SettingsForm/Index'

import AuthContext from '../../contexts/AuthContext'

import {
	ErrorResponse,
	SettingData
} from '../../utils/types'

import {
	emptySetting
} from '../../utils/emptyObjects'

import colors from '../../utils/colors'

import FTButton from "../../assets/42.png"
import ButtonImage from '../../componentsLibrary/ButtonImage'

const FTRedirectWrapper = styled.div`

	display: flex;
	align-items: center;

	padding-bottom: 15px;

	text-align: center;

`

type PropsSigninResponse = {
	access_token: string
} | {
	twoFA: boolean,
	id: number
}

function Signin() {
	const { token, url } = useContext(AuthContext)!
	const navigate = useNavigate()
	const [buttonDisabled, setButtonDisabled] = useState(false);

	const handleClick = () => {
		setButtonDisabled(true);
		
		setTimeout(() => {
		  setButtonDisabled(false);
		}, 2000);
	  };

	useEffect(() => {
		if (token)
			navigate("/error", {
				state: {
					message: "You are already authenticate",
					keepConnect: true
				}
			})
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

			const user = {
				username: username.value,
				hash: password.value
			}

			const signinResponse: AxiosResponse<PropsSigninResponse> = await axios.post(`${url}/auth/signin`, user)

			if ('twoFA' in signinResponse.data) {
				navigate("/twofa", {
					state: {
						userId: signinResponse.data.id
					}
				})
			}
			else {
				localStorage.setItem("access_token", signinResponse.data.access_token)
				navigate("/")
			}
		}
		catch (error) {
			if (axios.isAxiosError(error)) {
				const axiosError = error as AxiosError<ErrorResponse>
				const { statusCode, message } = axiosError.response?.data!
				if (statusCode === 403) {
					setPassword((prevState: SettingData) => ({
						...prevState,
						error: true,
						errorMessage: message
					}))
				}
				else if (statusCode === 404) {
					setUsername((prevState: SettingData) => ({
						...prevState,
						error: true,
						errorMessage: message
					}))
				}
				else
					navigate("/error")
			}
			else
				navigate("/error")
		}
	}

	/* ================================ USERNAME =================================== */

	const [username, setUsername] = useState<SettingData>(emptySetting)

	function handleInputUsernameChange(event: ChangeEvent<HTMLInputElement>) {
		const value = event.target.value
		setUsername({
			value: value,
			error: false
		})
	}

	/* ============================== PASSWORD ================================== */

	const [password, setPassword] = useState<SettingData>(emptySetting)

	function handleInputPasswordChange(event: ChangeEvent<HTMLInputElement>) {
		const value = event.target.value
		setPassword({
			value: value,
			error: false
		})
	}

	const [showPassword, setShowPassword] = useState<boolean>(false)

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
					Sign in
				</WindowTitle>
				<VerticalSettingsForm
					onSubmit={handleSubmit}
					autoComplete="off"
					spellCheck="false">
					<VerticalSetting fontSize={20}>
						Username
						<VerticalSettingWrapper>
							<InputText
								onChange={handleInputUsernameChange}
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
							<ErrorMessage>
								{password.error && password.errorMessage}
							</ErrorMessage>
							<Button
								onClick={() => setShowPassword(!showPassword)}
								type="button" fontSize={"18px"} width={231}
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
					<div style={{ marginTop: "10px" }} />
					<Button
						type="submit" fontSize={"35px"}
						alt="Continue button" title="Continue">
						Continue
					</Button>
				</VerticalSettingsForm>
				<div>
					Don't have an account?&nbsp;
					<StyledLink to="/signup" color={colors.button}>
						Sign up
					</StyledLink>
				</div>
				<Separator />
				<FTRedirectWrapper>
					{
						buttonDisabled ?
						<ButtonImage alt="Loading button" title="Loading">
							<img src={FTButton} style={{ paddingRight: "7px" }} />
							Loading...
						</ButtonImage>
						:
						<LinkButtonImage to={`${url}/auth/api42`} onClick={handleClick}
							alt="42 auth button" title="Auth with 42">
							<img src={FTButton} style={{ paddingRight: "7px" }} />
							Continue with 42
						</LinkButtonImage>

					}
				</FTRedirectWrapper>
			</CentralWindow>
		</Page>
	)
}

export default Signin