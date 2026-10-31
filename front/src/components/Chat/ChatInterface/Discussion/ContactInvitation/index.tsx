import { trackEvent } from "../../../../../lib/analytics"
import {
	useContext
} from "react"

import {
	Avatar,
	Style,
	Text,
	InvitationContent,
	ButtonsWrapper
} from "./style"

import {
	handleClickChallengeStatus,
	showCard,
	showContextualMenu
} from "../functions"

import ButtonChallenge from "../../../../../componentsLibrary/ButtonChallenge"
import ButtonChallengeLocked from "../../../../../componentsLibrary/ButtonChallengeLocked"

import ContextualMenuContext from "../../../../../contexts/ContextualMenuContext"
import CardContext from "../../../../../contexts/CardContext"
import DisplayContext from "../../../../../contexts/DisplayContext"
import InteractionContext from "../../../../../contexts/InteractionContext"
import AuthContext from "../../../../../contexts/AuthContext"

import {
	challengeStatus,
	userStatus
} from "../../../../../utils/status"

import {
	ErrorResponse,
	User,
	UserAuthenticate
} from "../../../../../utils/types"

import colors from "../../../../../utils/colors"
import axios, { AxiosError } from "axios"

type PropsContactInvitation = {
	sender: User,
	target: User | UserAuthenticate,
	initialStatus: challengeStatus,
	idMsg: number,
	idChan: number
}

function ContactInvitation({ sender, target, initialStatus, idMsg, idChan }: PropsContactInvitation) {

	const { token, url } = useContext(AuthContext)!
	const { displayContextualMenu, setContextualMenuPosition } = useContext(ContextualMenuContext)!
	const { displayCard, setCardPosition } = useContext(CardContext)!
	const { setZCardIndex, zMaxIndex, displayPopupError, GameWrapperRef } = useContext(DisplayContext)!
	const { userTarget, setUserTarget, userAuthenticate, channelTarget, gameState, searching } = useContext(InteractionContext)!
	
	async function handleSpectate(userId:Number, targetid : number){
		try {
			await axios.patch(`${url}/pong/spectate/${userId}`, 
			{ userId: targetid},
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


	return (
		<Style>
			{
				sender.id &&
				<Avatar
					src={sender.avatar}
					onClick={(event) => showCard(event, sender.id, {
						displayCard,
						setZCardIndex,
						setCardPosition,
						setUserTarget,
						url,
						token,
						displayPopupError,
						zMaxIndex,
						GameWrapperRef
					})}
					onAuxClick={(event) => showContextualMenu(event, sender.id, {
						setContextualMenuPosition,
						displayContextualMenu,
						displayCard,
						userAuthenticate,
						userTarget,
						setUserTarget,
						channelTarget,
						url,
						token,
						displayPopupError,
						GameWrapperRef
					})}
					tabIndex={0} />
			}
			<InvitationContent>
				<Text>
					{sender.username} challenge {target.username} to a duel !
				</Text>
				{
					initialStatus === challengeStatus.PENDING && target.id === userAuthenticate.id &&
					<ButtonsWrapper>
						{
							(!gameState && !searching) ?
							<ButtonChallenge
								onClick={() => {
									trackEvent("game-invite-accept")
									handleClickChallengeStatus(challengeStatus.IN_PROGRESS, idMsg, idChan, {
										userAuthenticate,
										displayPopupError,
										token,
										url
									})
								}}
								color={colors.buttonGreen}
								alt="Accept button" title="Accept">
								Accept
							</ButtonChallenge>
							:
							<ButtonChallengeLocked
								color={colors.buttonGray}
								title="Accept">
								Accept
							</ButtonChallengeLocked>
						}
						<ButtonChallenge
							onClick={() => handleClickChallengeStatus(challengeStatus.CANCELLED, idMsg, idChan, {
								userAuthenticate,
								displayPopupError,
								token,
								url
							})}
							color={colors.buttonRed}
							alt="Decline button" title="Decline">
							Decline
						</ButtonChallenge>
					</ButtonsWrapper>
				}
				{
					initialStatus === challengeStatus.IN_PROGRESS &&
					<ButtonsWrapper>
						{
							target.id === userAuthenticate.id ?
							<ButtonChallengeLocked
								color={colors.buttonGreen}
								title="Accepted">
								Accepted !
							</ButtonChallengeLocked>
							: userAuthenticate.status === userStatus.ONLINE ?
							<ButtonChallenge
								onClick={() => handleSpectate(userAuthenticate.id, target.id)}
								color={colors.button}
								alt="Spectate button" title="Accepted">
								Spectate
							</ButtonChallenge>
							:
							<ButtonChallengeLocked
								color={colors.buttonGray}
								title="Accepted">
								Spectate
							</ButtonChallengeLocked>
						}
					</ButtonsWrapper>
				}
				{
					initialStatus === challengeStatus.CANCELLED &&
					<ButtonsWrapper>
						<ButtonChallengeLocked
							color={colors.buttonGray}
							title="Cancelled">
							Cancelled
						</ButtonChallengeLocked>
					</ButtonsWrapper>
				}
				{
					initialStatus === challengeStatus.FINISHED &&
					<ButtonsWrapper>
						<ButtonChallengeLocked
							color={colors.button}
							title="Finished">
							Finished
						</ButtonChallengeLocked>
					</ButtonsWrapper>
				}
			</InvitationContent>
		</Style>
	)
}

export default ContactInvitation