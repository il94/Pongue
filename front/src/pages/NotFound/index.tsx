import Page from "../../componentsLibrary/Page"
import MainTitle from "../../componentsLibrary/MainTitle"
import StyledLink from "../../componentsLibrary/StyledLink/Index"
import CentralWindow from "../../componentsLibrary/CentralWindow"
import WindowTitle from "../../componentsLibrary/WindowTitle"

import colors from "../../utils/colors"

function NotFound() {
	return (
		<Page>
			<MainTitle>
				<StyledLink to="/">
					Retro Versus
				</StyledLink>
			</MainTitle>
			<CentralWindow>
				<WindowTitle>
					404
				</WindowTitle>
				Page not found
				<div style={{ height: "10px" }} />
				<StyledLink to="/" color={colors.button}>
					Home
				</StyledLink>
				<div style={{ height: "5px" }} />
			</CentralWindow>
		</Page>
	)
}

export default NotFound
