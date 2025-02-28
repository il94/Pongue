import {
	useContext,
	useState
} from "react"
import {
	useNavigate
} from "react-router-dom"

import {
	LogoFull,
	LogoReduced,
	Style
} from "./style"

import InteractionContext from "../../contexts/InteractionContext"
import DisplayContext from "../../contexts/DisplayContext"

import {
	userStatus
} from "../../utils/status"

import HomeIcon from "../../assets/home.png"
import YellowHomeIcon from "../../assets/yellow_home.png"
import axios from "axios"
import AuthContext from "../../contexts/AuthContext"

type PropsLogo = {
	social: boolean
}

function Logo({ social }: PropsLogo) {

	const { userAuthenticate} = useContext(InteractionContext)!
	const { displayPopupError } = useContext(DisplayContext)!
	const { token, url } = useContext(AuthContext)!
	const navigate = useNavigate()
	const [homeIcon, setHomeIcon] = useState<string>(HomeIcon)

	return (
		<Style onClick={async () => {
			
			if (userAuthenticate.status === userStatus.ONLINE)
			{
				await axios.patch(`${url}/pong/${userAuthenticate.id}/cancel`, {}, {
				headers: {
					'Authorization': `Bearer ${token}`
				}
				})
				navigate("/")
			}
			else
				displayPopupError({ display: true, message: "You can't go to Home when you are busy" })
			}}>
			{
				social ?
				<LogoFull tabIndex={0}>
					RETRO VERSUS
				</LogoFull>
				:
				<LogoReduced
					onFocus={() => setHomeIcon(YellowHomeIcon)}
					onBlur={() => setHomeIcon(HomeIcon)}
					src={homeIcon}
					tabIndex={0} />
			}
		</Style>
	)
}

export default Logo