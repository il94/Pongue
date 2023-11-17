import { RefObject, useContext, useRef } from "react"

import {
	Style,
	ProfileName,
	ProfilePicture,
	ProfileInfo,
	ProfileStatus
} from "./style"

import { CardContext } from "../../../pages/Game" 


function Friend({ social, color } : { social: boolean, color: string }) {

	const { displayCard, setCardPosition } = useContext(CardContext)!
	const friendContainerRef : RefObject<HTMLElement> = useRef(null)

	function showCard() {
		
		const friendcontainer = friendContainerRef.current

		if (friendcontainer)
		{
			const topCurrentElement = friendcontainer.getBoundingClientRect().top
			const { top: topParentElement, height: heightParentElement } = friendcontainer.parentElement!.getBoundingClientRect()
			
			const topMax = heightParentElement - 371 // taille de la carte
	
			const topCard = topCurrentElement - topParentElement > topMax ? topMax : topCurrentElement - topParentElement // s'assure que la carte ne sorte pas de l'écran si elle est trop basse
		
			setCardPosition(topCard)
			displayCard(true)
		}
		
	}

	return (
		<Style onClick={showCard} color={color} ref={friendContainerRef}>
			<ProfilePicture />
			{
				!social &&
			<ProfileInfo>
				<ProfileName>
					Example
				</ProfileName>
				<ProfileStatus>
					En recherche de partie...
				</ProfileStatus>
			</ProfileInfo>
			}

		</Style>
	)
}

export default Friend