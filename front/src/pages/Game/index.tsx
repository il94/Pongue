import React, { createContext, useEffect, useState } from 'react'
import { useMediaQuery } from 'react-responsive'

import {
	GamePage,
	GameWrapper,
	TopGameWrapper,
	BottomGameWrapper,
	LeftGameWrapper,
	RightGameWrapper
} from './style'

import Logo from '../../components/Logo'
import Info from '../../components/Info'
import Social from '../../components/Social'
import Pong from '../../components/Pong'
import Profile from '../../components/Profile'
import Chat from '../../components/Chat'
import ChatButton from '../../components/Chat/ChatButton'
import Card from '../../components/Card'

import breakpoints from '../../utils/breakpoints'

export const ChatContext = createContext<{
	chat: boolean,
	displayChat: React.Dispatch<React.SetStateAction<boolean>>,
	contactListScrollValue: number,
	setContactListScrollValue: React.Dispatch<React.SetStateAction<number>>,
	chatScrollValue: number,
	setChatScrollValue: React.Dispatch<React.SetStateAction<number>>,
	chatRender: boolean,
	setChatRender: React.Dispatch<React.SetStateAction<boolean>>
} | undefined>(undefined)

export const CardContext = createContext<{
	card: boolean,
	displayCard: React.Dispatch<React.SetStateAction<boolean>>,
	setCardPosition: React.Dispatch<React.SetStateAction<number>>
} | undefined>(undefined)

function Game() {

	const isSmallDesktop = useMediaQuery({ query: breakpoints.smallDesktop })

	const [social, displaySocial] = useState<boolean>(true)
	const [socialScrollValue, setSocialScrollValue] = useState<number>(0)
	const [chat, displayChat] = useState<boolean>(false)
	const [contactListScrollValue, setContactListScrollValue] = useState<number>(0)
	const [chatScrollValue, setChatScrollValue] = useState<number>(0)
	const [chatRender, setChatRender] = useState<boolean>(false)
	const [card, displayCard] = useState<boolean>(false)
	const [cardPosition, setCardPosition] = useState<number>(0)

	useEffect(() => {
		displaySocial(isSmallDesktop)
		if (!social)
			displayCard(false)
	}, [isSmallDesktop])

	return (
		<GamePage>
			{
				<GameWrapper>
					<LeftGameWrapper $social={social}>
						<Logo />
						<CardContext.Provider value={{ card, displayCard, setCardPosition }}>
							<Social social={social} displaySocial={displaySocial} socialScrollValue={socialScrollValue} setSocialScrollValue={setSocialScrollValue} />
						</CardContext.Provider>
					</LeftGameWrapper>
					<RightGameWrapper>
						<TopGameWrapper>
							<Info />
							<Profile />
						</TopGameWrapper>
						<BottomGameWrapper>
							<Pong />
							{
								card &&
								<Card cardPosition={cardPosition} />
							}
							{
								<ChatContext.Provider value={{ chat, displayChat, contactListScrollValue, setContactListScrollValue, chatScrollValue, setChatScrollValue, chatRender, setChatRender }}>
									<Chat />
								</ChatContext.Provider>
							}
						</BottomGameWrapper>
					</RightGameWrapper>
				</GameWrapper>
			}
		</GamePage>
	)
}

export default Game