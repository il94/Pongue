import { trackEvent } from "../../../lib/analytics"
import {
	Dispatch,
	SetStateAction,
	useContext
} from "react"
import axios, { AxiosError } from "axios"

import {
	ChannelName,
	ButtonsWrapper,
	Style,
	LeaveButtonWrapper
} from "./style"

import Icon from "../../../componentsLibrary/Icon"

import ChatContext from "../../../contexts/ChatContext"
import InteractionContext from "../../../contexts/InteractionContext"
import AuthContext from "../../../contexts/AuthContext"
import DisplayContext from "../../../contexts/DisplayContext"

import {
	channelIsMP,
	userIsOwner
} from "../../../utils/functions"

import {
	chatWindowStatus
} from "../../../utils/status"

import {
	ErrorResponse
} from "../../../utils/types"

import DeleteIcon from "../../../assets/trash.png"
import LeaveIcon from "../../../assets/deconnexion.png"
import ReduceIcon from "../../../assets/reduce.png"
import SettingsIcon from "../../../assets/settings.png"

type PropsBanner = {
	bannerName: string,
	chatWindowState: chatWindowStatus,
	setChatWindowState: Dispatch<SetStateAction<chatWindowStatus>>
}

function Banner({ bannerName, chatWindowState, setChatWindowState }: PropsBanner) {

	const { token, url } = useContext(AuthContext)!
	const { userAuthenticate, channelTarget } = useContext(InteractionContext)!
	const { displayPopupError } = useContext(DisplayContext)!
	const { displayChatNotification } = useContext(ChatContext)!

	async function deleteChannelMP() {
		try {
			if (!channelTarget)
				throw new Error

			await axios.delete(`${url}/channel/${channelTarget.id}`, {
				headers: {
					'Authorization': `Bearer ${token}`
				}
			})
			trackEvent("channel-delete")
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

	async function leaveChannel() {
		try {
			if (!channelTarget)
				throw new Error
			await axios.delete(`${url}/channel/${channelTarget.id}/leave/${userAuthenticate.id}`, {
				headers: {
					'Authorization': `Bearer ${token}`
				}
			})
			trackEvent("channel-leave")
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

	const { displayChat } = useContext(ChatContext)!

	return (
		<Style>
			<LeaveButtonWrapper>
				{
					chatWindowState === chatWindowStatus.CHANNEL ?
						channelTarget && channelIsMP(channelTarget) ?
							<Icon
								onClick={deleteChannelMP}
								src={DeleteIcon} size={24}
								alt="Leave button" title="Leave channel" />
							:
							<Icon
								onClick={leaveChannel}
								src={LeaveIcon} size={24}
								alt="Leave button" title="Leave channel" />
						:
						<div style={{ width: "26.5px" }} />
				}
			</LeaveButtonWrapper>
			<ChannelName>
				{bannerName}
			</ChannelName>
			<ButtonsWrapper>
				{
					(channelTarget &&
						userIsOwner(channelTarget, userAuthenticate.id) &&
						!channelIsMP(channelTarget) &&
						chatWindowState === chatWindowStatus.CHANNEL) ?
						<Icon
							onClick={() => setChatWindowState(chatWindowStatus.UPDATE_CHANNEL)}
							src={SettingsIcon} size={24}
							alt="Settings button" title="Settings" />
						:
						<div style={{ width: "24px" }} />
				}
				<Icon
					onClick={() => {displayChat(false); displayChatNotification(false)}}
					src={ReduceIcon} size={24}
					alt="Reduce button" title="Reduce" />
			</ButtonsWrapper>
		</Style>
	)
}

export default Banner