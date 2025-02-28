import {
	useEffect
} from 'react'
import {
	useLocation
} from 'react-router-dom'
import Cookies from 'js-cookie'

import StyledLink from '../../componentsLibrary/StyledLink/Index'

import Page from '../../componentsLibrary/Page'
import MainTitle from '../../componentsLibrary/MainTitle'
import CentralWindow from '../../componentsLibrary/CentralWindow'
import WindowTitle from '../../componentsLibrary/WindowTitle'

import colors from '../../utils/colors'

function Error() {

	const location = useLocation()
	const message: string | undefined = location.state?.message ? location.state.message : Cookies.get("error_message")

	useEffect(() => {
		if (location.state?.keepConnect)
			return
		localStorage.removeItem("access_token")
		Cookies.remove("error_message")
	}, [])

	return (
		<Page>
			<MainTitle>
				<StyledLink to="/">
					Pongue
				</StyledLink>
			</MainTitle>
			<CentralWindow>
				<WindowTitle>
					Error
				</WindowTitle>
				{
					message ? message : "An error has occurred"
				}
				<div style={{ height: "10px" }} />
				<StyledLink to="/" color={colors.button}>
					Home
				</StyledLink>
				<div style={{ height: "10px" }} />
			</CentralWindow>
		</Page>
	)
}

export default Error