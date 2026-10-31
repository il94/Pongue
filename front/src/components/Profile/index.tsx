import { trackEvent } from "../../lib/analytics"
import {
	SetStateAction,
	Dispatch,
	useContext,
	MouseEvent
} from "react"
import {
	useNavigate
} from "react-router"
import axios, { AxiosError } from "axios"

import {
	Style,
	ProfileWrapper,
	ButtonsWrapper,
	ProfileName,
	Avatar,
} from "./style"

import Icon from "../../componentsLibrary/Icon"

import AuthContext from "../../contexts/AuthContext"
import InteractionContext from "../../contexts/InteractionContext"

import {
	ErrorResponse
} from '../../utils/types'

import deconnexionIcon from "../../assets/deconnexion.png"
import settingsIcon from "../../assets/settings.png"

type PropsProfile = {
	card: boolean,
	displayCard: Dispatch<SetStateAction<boolean>>,
	setCardPosition: Dispatch<SetStateAction<{
		left?: number,
		right?: number,
		top?: number,
		bottom?: number
	}>>,
	settings: boolean,
	displaySettingsMenu: Dispatch<SetStateAction<boolean>>
}

function Profile({ card, displayCard, setCardPosition, settings, displaySettingsMenu }: PropsProfile) {

	const { token, url } = useContext(AuthContext)!
	const { userAuthenticate, userTarget, setUserTarget } = useContext(InteractionContext)!
	const navigate = useNavigate()

	function showCard(event: MouseEvent<HTMLDivElement>) {
		event.stopPropagation()
		if (card && userTarget.id === userAuthenticate.id)
			displayCard(false)
		else {
			setUserTarget(userAuthenticate)
			setCardPosition({ right: 0, top: 0 })
			displayCard(true)
		}
	}

	async function handleDeconnexionClickButton() {
		try {
			await axios.get(`${url}/auth/logout`, {
				headers: {
					'Authorization': `Bearer ${token}`
				}
			}) 
			
			trackEvent("logout")
			localStorage.removeItem('access_token')
			navigate("/")
		}
		catch (error) {
			if (axios.isAxiosError(error)) {
				const axiosError = error as AxiosError<ErrorResponse>
				const { statusCode, message } = axiosError.response?.data!
				if (statusCode === 403 || statusCode === 404)
				{
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

	return (
		<Style>
			<ProfileWrapper
				onClick={(event) => showCard(event)}
				tabIndex={0}>
				{
					userAuthenticate.avatar &&
					<Avatar src={userAuthenticate.avatar} />
				}
				<ProfileName>
					{userAuthenticate.username}
				</ProfileName>
			</ProfileWrapper>
			<ButtonsWrapper>
				<Icon
					onClick={() => displaySettingsMenu(!settings)}
					src={settingsIcon} size={38}
					alt="Settings button" title="Settings" />
				<Icon
					onClick={handleDeconnexionClickButton}
					src={deconnexionIcon} size={38}
					alt="Deconnexion button" title="Deconnexion" />
			</ButtonsWrapper>
		</Style>
	)
}

export default Profile