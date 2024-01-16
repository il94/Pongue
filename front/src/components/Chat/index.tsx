import {
	Dispatch,
	SetStateAction,
	useContext,
	useEffect,
	useState
} from "react"

import {
	Style,
	ChatButton,
	TopChatWrapper,
	BottomChatWrapper,
	ChannelCreateButton
} from "./style"

import ChannelList from "./ChannelList"
import ChatInterface from "./ChatInterface"
import ChannelInterface from "./ChannelInterface"
import Banner from "./Banner"
import Icon from "../../componentsLibrary/Icon"
import HomeInterface from "./HomeInterface"
import LockedInterface from "./LockedInterface"
import ErrorRequest from "../../componentsLibrary/ErrorRequest"

import DisplayContext from "../../contexts/DisplayContext"

import { Channel, UserAuthenticate } from "../../utils/types"
import { channelStatus, chatWindowStatus } from "../../utils/status"

import ChatIcon from "../../assets/chat.png"

type PropsChat = {
	chat: boolean,
	displayChat: Dispatch<SetStateAction<boolean>>,
	channels: Channel[],
	channelTarget: Channel | undefined,
	setChannelTarget: Dispatch<SetStateAction<Channel | undefined>>,
	chatWindowState: chatWindowStatus,
	setChatWindowState: Dispatch<SetStateAction<chatWindowStatus>>,
	userAuthenticate: UserAuthenticate
}

function Chat({ chat, displayChat, channels, channelTarget, setChannelTarget, chatWindowState, setChatWindowState, userAuthenticate }: PropsChat) {

	function handleCickChatButton() {
		displayChat(true)
		setZChatIndex(zChatIndex + 1)
	}

	const { zChatIndex, setZChatIndex, zMaxIndex } = useContext(DisplayContext)!

	const [errorRequest, setErrorRequest] = useState<boolean>(false)

	const [valueChannelCreateButton, setValueChannelCreateButton] = useState<string>("Create")
	const [bannerName, setBannerName] = useState<string>("Welcome")

	useEffect(() => {
		setZChatIndex(zMaxIndex + 1)
	}, [])

	useEffect(() => {
		if (chatWindowState === chatWindowStatus.HOME) {
			setValueChannelCreateButton("Create")
			setBannerName("Welcome")
		}
		else if (channelTarget && chatWindowState === chatWindowStatus.CHANNEL) {
			setValueChannelCreateButton("Create")
			setBannerName(channelTarget.name)
		}
		else if (channelTarget && (chatWindowState === chatWindowStatus.UPDATE_CHANNEL || chatWindowState === chatWindowStatus.LOCKED_CHANNEL)) {
			setValueChannelCreateButton("<<")
			setBannerName(channelTarget.name)
		}
		else if (chatWindowState === chatWindowStatus.CREATE_CHANNEL) {
			setValueChannelCreateButton("<<")
			setBannerName("Create")
		}
		else
			setChatWindowState(chatWindowStatus.HOME)

	}, [chatWindowState, channelTarget])

	useEffect(() => {
		if (channelTarget)
		{
			if (channelTarget.type === channelStatus.PROTECTED &&
				!channelTarget.members.some((member) => member.id === userAuthenticate.id) &&
				channelTarget.owner?.id !== userAuthenticate.id)
				setChatWindowState(chatWindowStatus.LOCKED_CHANNEL)
			else
				setChatWindowState(chatWindowStatus.CHANNEL)
		}
		else
			setChatWindowState(chatWindowStatus.HOME)
	}, [channelTarget])

	function handleClickCreateButton() {

		if (chatWindowState === chatWindowStatus.HOME)
			setChatWindowState(chatWindowStatus.CREATE_CHANNEL)
		else if (chatWindowState === chatWindowStatus.CHANNEL)
			setChatWindowState(chatWindowStatus.CREATE_CHANNEL)
		else if (chatWindowState === chatWindowStatus.LOCKED_CHANNEL)
			setChatWindowState(chatWindowStatus.HOME)
		else if (chatWindowState === chatWindowStatus.UPDATE_CHANNEL)
			setChatWindowState(chatWindowStatus.CHANNEL)
		else if (chatWindowState === chatWindowStatus.CREATE_CHANNEL) {
			if (!channelTarget)
				setChatWindowState(chatWindowStatus.HOME)
			else
				setChatWindowState(chatWindowStatus.CHANNEL)
		}
	}

	return (
		chat ?
			<Style
				onContextMenu={(event) => event.preventDefault()}
				onClick={() => { setZChatIndex(zMaxIndex + 1) }}
				$zIndex={zChatIndex}>
				{
					!errorRequest ?
						<>
							<TopChatWrapper>
								<ChannelCreateButton onClick={handleClickCreateButton}>
									{valueChannelCreateButton}
								</ChannelCreateButton>
								<Banner
									chatWindowState={chatWindowState}
									setChatWindowState={setChatWindowState}
									bannerName={bannerName}
									setErrorRequest={setErrorRequest} />
							</TopChatWrapper>
							<BottomChatWrapper>
								{
									chatWindowState === chatWindowStatus.UPDATE_CHANNEL ||
										chatWindowState === chatWindowStatus.CREATE_CHANNEL ?
										<ChannelInterface
											channel={channelTarget}
											chatWindowState={chatWindowState}
											setChatWindowState={setChatWindowState}
											setBannerName={setBannerName} />
										:
										<>
											<ChannelList
												channels={channels}
												setChannelTarget={setChannelTarget}
												setErrorRequest={setErrorRequest} />
											{
												chatWindowState === chatWindowStatus.HOME ||
													!channelTarget ?
													<HomeInterface />
													: chatWindowState === chatWindowStatus.LOCKED_CHANNEL ?
														<LockedInterface
															channel={channelTarget}
															setChannel={setChannelTarget as Dispatch<SetStateAction<Channel>>}
															setErrorRequest={setErrorRequest} />
														:
														<ChatInterface
															channel={channelTarget}
															setChannel={setChannelTarget as Dispatch<SetStateAction<Channel>>}/>
											}
										</>
								}
							</BottomChatWrapper>
						</>
						:
						<ErrorRequest />
				}
			</Style>
			:
			<ChatButton $zIndex={zChatIndex + 1}>
				<Icon
					onClick={handleCickChatButton}
					src={ChatIcon} size={38}
					alt="Chat button" title="Chat" />
			</ChatButton>
	)
}

export default Chat