import {
	useContext,
	useEffect,
	useRef
} from 'react'
import styled from 'styled-components'
import axios, { AxiosError } from 'axios'
import Cookies from "js-cookie"
import {
	useNavigate
} from 'react-router'

import LinkButton from '../../componentsLibrary/LinkButton'
import StyledLink from '../../componentsLibrary/StyledLink/Index'
import ActiveText from '../../componentsLibrary/ActiveText/Index'

import Page from '../../componentsLibrary/Page'
import MainTitle from '../../componentsLibrary/MainTitle'
import CentralWindow from '../../componentsLibrary/CentralWindow'
import WindowTitle from '../../componentsLibrary/WindowTitle'
import Button from '../../componentsLibrary/Button'

import AuthContext from '../../contexts/AuthContext'

import {
	ErrorResponse
} from '../../utils/types'

import colors from '../../utils/colors'

const ButtonsWrapper = styled.div`

	display: flex;
	justify-content: space-evenly;

	width: 100%;

	padding-bottom: 15px;

`


function Home() {

	const { token, setToken, url } = useContext(AuthContext)!
	const navigate = useNavigate()

	window.onpopstate = async () => {
		// console.log("fleche retour")
		await axios.get(`${url}/pong/back`, {
				headers: {
					'Authorization': `Bearer ${token}`
				}
			})
	}


	useEffect(() => {

		async function getToken() {
			try {
				// Recupere le token soit par les cookies, soit en local
				const access_token: string | null | undefined = Cookies.get('access_token') ?
					Cookies.get('access_token')
					:
					localStorage.getItem('access_token')

				// Si un token est trouve, verifie si'il est valide et le set
				if (access_token)
				{
					await axios.post(`${url}/auth/token`, {}, {
						headers: {
							'Authorization': `Bearer ${access_token}`
						}
					})
					localStorage.setItem('access_token', access_token)
					setToken(access_token)
				}
				else
					setToken('')
			}
			catch (error) {
				setToken('')
				localStorage.removeItem("access_token")
				return (false)
			}
			finally {
				Cookies.remove('access_token')
				Cookies.remove('usernameId')
				Cookies.remove('avatar')
				Cookies.remove('two_FA')
				Cookies.remove('userId')
				Cookies.remove('error_message')
			}
		}
		getToken()

		const GameButtonContainer = gameButtonRef.current
		if (GameButtonContainer)
			GameButtonContainer.focus()

	}, [])

	// Déconnecte le user en supprimant son token des cookies et en local
	async function handleDeconnexionClickText() {
		try {
			await axios.get(`${url}/auth/logout`, {
				headers: {
					'Authorization': `Bearer ${token}`
				}
			}) 
			
			localStorage.removeItem('access_token')
			setToken('')
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

	const gameButtonRef = useRef<HTMLButtonElement>(null)

	return (
		<Page>
			<MainTitle>
				<StyledLink to="/">
					Pongue
				</StyledLink>
			</MainTitle>
			<CentralWindow>
				<WindowTitle>
					Welcome
				</WindowTitle>
				{
					token ?
						<>
							<Button
								onClick={() => navigate("/game")}
								fontSize={"35px"}
								alt="Game button" title="Game"
								ref={gameButtonRef}>
								Game !
							</Button>
							<ActiveText
								onClick={handleDeconnexionClickText}
								color={colors.button}>
								Disconnect
							</ActiveText>
						</>
						:
						<ButtonsWrapper>
							<LinkButton
								to="/signin" width={165} fontSize={35}
								alt="Sign in button" title="Sign in">
								Sign in
							</LinkButton>
							<LinkButton
								to="/signup" width={165} fontSize={35}
								alt="Sign up button" title="Sign up">
								Sign up
							</LinkButton>
						</ButtonsWrapper>
				}
			</CentralWindow>
		</Page>
	)
}

export default Home