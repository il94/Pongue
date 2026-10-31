import { trackEvent } from "../../../lib/analytics"
import {
	Dispatch,
	MouseEvent,
	SetStateAction,
	useContext,
	useEffect,
	useState
} from "react"
import axios, { AxiosError, AxiosResponse } from "axios"

import {
	Style
} from "./style"

import Section, { SectionName } from "../../../componentsLibrary/Section"

import InteractionContext from "../../../contexts/InteractionContext"
import AuthContext from "../../../contexts/AuthContext"
import DisplayContext from "../../../contexts/DisplayContext"

import {
	findChannelMP,
	userIsAdministrator,
	userIsBanned,
	userIsBlocked,
	userIsFriend,
	userIsInChannel,
	userIsOwner
} from "../../../utils/functions"

import {
	Channel,
	ChannelData,
	ErrorResponse,
	UserAuthenticate
} from "../../../utils/types"

import {
	channelRole,
	ChannelType,
	contextualMenuStatus,
	messageType,
	userStatus
} from "../../../utils/status"

type PropsContextualMenu = {
	type: contextualMenuStatus | undefined,
	contextualMenuPosition: {
		left?: number,
		right?: number,
		top?: number,
		bottom?: number
	},
	displaySecondaryContextualMenu: Dispatch<SetStateAction<boolean>>,
	setSecondaryContextualMenuPosition: Dispatch<SetStateAction<{
		left?: number,
		right?: number,
		top?: number,
		bottom?: number
	}>>,
	secondaryContextualMenuHeight: number,
	displayChat: Dispatch<SetStateAction<boolean>>
}

function ContextualMenu({ type, contextualMenuPosition, displaySecondaryContextualMenu, setSecondaryContextualMenuPosition, secondaryContextualMenuHeight, displayChat }: PropsContextualMenu) {

	const { token, url } = useContext(AuthContext)!
	const { userAuthenticate, setUserAuthenticate, userTarget, channelTarget, setChannelTarget } = useContext(InteractionContext)!
	const { displayPopupError } = useContext(DisplayContext)!

	/* ====================== SECONDARY CONTEXTUAL MENU ========================= */

	function showSecondaryContextualMenu(event: MouseEvent<HTMLButtonElement>) {

		const inviteSectionContainer = event.target as HTMLElement

		if (inviteSectionContainer) {
			const horizontalBorder = window.innerHeight * 5 / 100 // height des bordures horizontales autour du jeu
			const maxBottom = window.innerHeight - horizontalBorder - secondaryContextualMenuHeight // valeur max avant que le menu ne depasse par le bas
			const { x: leftMenu, y: topMenu } = inviteSectionContainer.getBoundingClientRect() // position du menu principal

			const offsetX = leftMenu < window.innerWidth ? 180 : -180 // determine de quel cote le menu secondaire doit etre decale par rapport a la position du menu principal
			let offsetY = 0 // decalage vertical par defaut du menu secondaire si il ne depasse pas

			if (topMenu - horizontalBorder / 2 > maxBottom) // verifie si le menu secondaire depasse sur l'axe vertical
				offsetY = maxBottom - (topMenu - horizontalBorder / 2) // ajuste le resultat vertical

			setSecondaryContextualMenuPosition({
				left: contextualMenuPosition.left && contextualMenuPosition.left + offsetX,
				right: contextualMenuPosition.right && contextualMenuPosition.right + offsetX,
				top: contextualMenuPosition.top && contextualMenuPosition.top + offsetY,
				bottom: contextualMenuPosition.bottom && contextualMenuPosition.bottom + offsetY
			})
			displaySecondaryContextualMenu(true)
		}
	}

	/* ============================== MP SECTION ================================ */

	async function handleContactClickEvent(): Promise<Channel | undefined> {
		try {
			const channelMP = findChannelMP(userAuthenticate, userTarget.username)
			if (channelMP) {

				const channelMPResponse: AxiosResponse<Channel> = await axios.get(`${url}/channel/${channelMP.id}/relations`, {
					headers: {
						'Authorization': `Bearer ${token}`
					}
				})

				setChannelTarget(channelMPResponse.data)
				displayChat(true)
				return (channelMPResponse.data)
			}
			else {
				const newChannelMPResponse: AxiosResponse<ChannelData> = await axios.post(`${url}/channel/mp/${userTarget.id}`, {}, {
					headers: {
						'Authorization': `Bearer ${token}`
					}
				})

				trackEvent("channel-create", { type: "mp" })

				const newChannelMP: Channel = {
					...newChannelMPResponse.data,
					messages: [],
					members: [
						userAuthenticate,
						userTarget
					],
					administrators: [],
					owner: undefined,
					banneds: [],
					muteInfo: []
				}

				setUserAuthenticate((prevState) => ({
					...prevState,
					channels: [
						...prevState.channels,
						newChannelMP
					]
				}))
	
				setChannelTarget(newChannelMP)
				displayChat(true)

				return (newChannelMP)
			}
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
			return (undefined)
		}
	}

	/* ========================== CHALLENGE SECTION ============================= */

	async function handleChallengeClickEvent() {
		try {
			let channel: Channel

			if (type === contextualMenuStatus.SOCIAL) {
				const channelMP = await handleContactClickEvent()
				if (channelMP)
					channel = channelMP
				else
					return
			}
			else if (channelTarget)
				channel = channelTarget
			else
				throw new Error

			await axios.post(`${url}/channel/${channel.id}/invitation`, {
				msgStatus: messageType.INVITATION,
				targetId: userTarget.id
			},
			{
				headers: {
					'Authorization': `Bearer ${token}`
				}
			})

			trackEvent("game-invite-send")
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

	/* ========================== CHALLENGE SECTION ============================= */

	async function handleSpectateEvent() {
		try {
			await axios.patch(`${url}/pong/spectate/${userAuthenticate.id}`, 
			{ userId: userTarget.id},
			{
			headers: {
				'Authorization': `Bearer ${token}`
			}
		})
			trackEvent("spectate-start")
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
	}

	/* ============================ FRIEND SECTION ============================== */

	async function handleManageFriendClickEvent() {
		try {
			if (!userIsFriend(userAuthenticate, userTarget.id)) {
				await axios.post(`${url}/friends/${userTarget.id}`, {}, {
					headers: {
						'Authorization': `Bearer ${token}`
					}
				})
				setUserAuthenticate((prevState: UserAuthenticate) => ({
					...prevState,
					friends: [...prevState.friends, userTarget]
				}))
				trackEvent("friend-add")
			}
			else {
				await axios.delete(`${url}/friends/${userTarget.id}`, {
					headers: {
						'Authorization': `Bearer ${token}`
					}
				})
				setUserAuthenticate((prevState: UserAuthenticate) => ({
					...prevState,
					friends: prevState.friends.filter((friend) => friend.id !== userTarget.id)
				}))
				trackEvent("friend-remove")
			}
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

	/* ============================= BLOCK SECTION ============================== */

	async function handleBlockClickEvent() {
		try {
			if (!userIsBlocked(userAuthenticate, userTarget.id)) {
				await axios.post(`${url}/blockeds/${userTarget.id}`, {}, {
					headers: {
						'Authorization': `Bearer ${token}`
					}
				})
				setUserAuthenticate((prevState: UserAuthenticate) => ({
					...prevState,
					blockeds: [...prevState.blockeds, userTarget]
				}))
				trackEvent("user-block")
			}
			else {
				await axios.delete(`${url}/blockeds/${userTarget.id}`, {
					headers: {
						'Authorization': `Bearer ${token}`
					}
				})
				setUserAuthenticate((prevState: UserAuthenticate) => ({
					...prevState,
					blockeds: prevState.blockeds.filter((friend) => friend.id !== userTarget.id)
				}))
				trackEvent("user-unblock")
			}
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

	/* ============================ GRADE SECTION =============================== */

	async function handleGradeClickEvent() {
		try {
			if (!channelTarget)
				throw new Error
			if (!userIsAdministrator(channelTarget, userTarget.id)) {
				await axios.patch(`${url}/channel/${channelTarget.id}/role/${userTarget.id}`, {
					role: channelRole.ADMIN
				},
					{
						headers: {
							'Authorization': `Bearer ${token}`
						}
					})
			}
			else {
				await axios.patch(`${url}/channel/${channelTarget.id}/role/${userTarget.id}`, {
					role: channelRole.MEMBER
				},
					{
						headers: {
							'Authorization': `Bearer ${token}`
						}
					})
			}
			trackEvent("channel-role-set")
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

	/* ============================= MUTE SECTION =============================== */

	async function handleMuteClickEvent() {
		try {
			if (!channelTarget)
				throw new Error
	
			await axios.patch(`${url}/channel/${channelTarget.id}/mute/${userTarget.id}`, {}, {
				headers: {
					'Authorization': `Bearer ${token}`
				}
			})
			trackEvent("channel-mute")
				
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
	}

	/* ============================= KICK SECTION =============================== */

	async function handleKickClickEvent() {
		try {
			if (!channelTarget)
				throw new Error
			await axios.delete(`${url}/channel/${channelTarget.id}/leave/${userTarget.id}`, {
				headers: {
					'Authorization': `Bearer ${token}`
				}
			})
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

	/* ============================== BAN SECTION =============================== */

	async function handleBanClickEvent() {
		try {
			if (!channelTarget)
				throw new Error
			if (!userIsBanned(channelTarget, userTarget.id)) {
				await axios.patch(`${url}/channel/${channelTarget.id}/role/${userTarget.id}`, {
					role: channelRole.BANNED
				},
					{
						headers: {
							'Authorization': `Bearer ${token}`
						}
					})
			}
			else {
				await axios.patch(`${url}/channel/${channelTarget.id}/role/${userTarget.id}`, {
					role: channelRole.UNBANNED
				},
					{
						headers: {
							'Authorization': `Bearer ${token}`
						}
					})
			}
			trackEvent("channel-role-set")
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

	/* ============================== DISPLAY =================================== */

	const [adminSections, displayAdminSections] = useState<boolean>(false)
	useEffect(() => {
		if (channelTarget && 
			type === contextualMenuStatus.CHAT &&
			channelTarget.type !== ChannelType.MP &&
			(userIsOwner(channelTarget, userAuthenticate.id) ||
				(userIsAdministrator(channelTarget, userAuthenticate.id) &&
					!userIsOwner(channelTarget, userTarget.id)))) {
			displayAdminSections(true)
		}
		else {
			displayAdminSections(false)
		}
	}, [type])

	// Compte le nombre de channels du user qui ne sont pas des MP
	const channelToDisplay: number = userAuthenticate.channels.filter((channel) => channel.type !== ChannelType.MP).length

	/* ========================================================================== */

	return (
		userTarget &&
		<Style
			$left={contextualMenuPosition.left}
			$right={contextualMenuPosition.right}
			$top={contextualMenuPosition.top}
			$bottom={contextualMenuPosition.bottom}>
			{
				(channelToDisplay > 0 && !userIsBlocked(userAuthenticate, userTarget.id)) &&
				<Section onMouseEnter={showSecondaryContextualMenu}>
					<SectionName>
						Invite
					</SectionName>
				</Section>
			}
			<div onMouseEnter={() => displaySecondaryContextualMenu(false)}>
				{
					!userIsBlocked(userAuthenticate, userTarget.id) &&
					<Section onClick={handleContactClickEvent}>
						<SectionName>
							Contact
						</SectionName>
					</Section>
				}
				{
					(userAuthenticate.status === userStatus.ONLINE &&
						userTarget.status === userStatus.ONLINE) &&
					<Section onClick={handleChallengeClickEvent}>
						<SectionName>
							Challenge
						</SectionName>
					</Section>
				}
				{
					(userAuthenticate.status === userStatus.ONLINE &&
						userTarget.status === userStatus.PLAYING) &&
					<Section onClick={handleSpectateEvent}>
						<SectionName>
							Spectate
						</SectionName>
					</Section>
				}
				<Section onClick={handleManageFriendClickEvent}>
					<SectionName>
						{
							!userIsFriend(userAuthenticate, userTarget.id) ?
								"Add"
								:
								"Delete"
						}
					</SectionName>
				</Section>
				<Section onClick={handleBlockClickEvent}>
					<SectionName>
						{
							!userIsBlocked(userAuthenticate, userTarget.id) ?
								"Block"
								:
								"Unblock"
						}
					</SectionName>
				</Section>
				{
					adminSections &&
					<>
						{
							userIsInChannel(channelTarget!, userTarget.id) &&
							<>
								{
									userIsOwner(channelTarget!, userAuthenticate.id) &&
									<Section onClick={handleGradeClickEvent}>
										<SectionName>
											{
												!userIsAdministrator(channelTarget!, userTarget.id) ?
													"Upgrade"
													:
													"Downgrade"
											}
										</SectionName>
									</Section>
								}
								<Section onClick={handleMuteClickEvent}>
									<SectionName>
										Mute
									</SectionName>
								</Section>
								<Section onClick={handleKickClickEvent}>
									<SectionName>
										Kick
									</SectionName>
								</Section>
								<Section onClick={handleBanClickEvent}>
									<SectionName>
										Ban
									</SectionName>
								</Section>
							</>
						}
						{
							userIsBanned(channelTarget!, userTarget.id) &&
							<Section onClick={handleBanClickEvent}>
								<SectionName>
									Unban
								</SectionName>
							</Section>
						}
					</>
				}
			</div>
		</Style>
	)
}

export default ContextualMenu