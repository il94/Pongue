import { trackEvent } from "../../../lib/analytics"
import {
	Dispatch,
	SetStateAction,
	useContext,
	useEffect,
	useRef,
	useState
} from "react"
import axios, { AxiosError, AxiosResponse } from "axios"

import {
	NoResult,
	Style
} from "./style"

import {
	generateResults
} from "./functions"

import Loader from "../../../componentsLibrary/Loader"

import AuthContext from "../../../contexts/AuthContext"
import InteractionContext from "../../../contexts/InteractionContext"
import DisplayContext from "../../../contexts/DisplayContext"

import {
	userIsInChannel,
	sortChannelByName,
	sortUserByName,
	userIsBanned,
	userIsFriend
} from "../../../utils/functions"

import {
	Channel,
	ErrorResponse,
	User,
	UserAuthenticate
} from "../../../utils/types"
import {
	ChannelType,
	resultSearchBarType
} from "../../../utils/status"

type PropsSearchBar = {
	value: string,
	displayChat: Dispatch<SetStateAction<boolean>>
}

function ResultsSearchBar({ value, displayChat }: PropsSearchBar) {

	const { token, url } = useContext(AuthContext)!
	const { userAuthenticate, setUserAuthenticate, setChannelTarget } = useContext(InteractionContext)!
	const { loaderResultsSearchBar, setLoaderResultsSearchBar, displayPopupError } = useContext(DisplayContext)!

	/* ================================ SETUP =================================== */

	const [users, setUsers] = useState<User[]>([])
	const [usersFound, setUsersFound] = useState<User[]>([])
	const [channels, setChannels] = useState<Channel[]>([])
	const [channelsFound, setChannelsFound] = useState<Channel[]>([])

	// Récupère tout les users et channels accessibles depuis la db
	useEffect(() => {
		async function fetchUsersAndChannels() {
			try {
				setLoaderResultsSearchBar(true)

				const usersResponse: AxiosResponse<User[]> = await axios.get(`${url}/user`, {
					headers: {
						'Authorization': `Bearer ${token}`
					}
				})

				// Retire le user auth de la liste des résultats et trie par ordre alphabétique
				setUsers(usersResponse.data.filter((user: User) => (
					user.username != userAuthenticate.username
				)).sort(sortUserByName))

				const accessiblesChannelsResponse: AxiosResponse<Channel[]> = await axios.get(`${url}/channel/accessibles`, {
					headers: {
						'Authorization': `Bearer ${token}`
					}
				})

				// Trie les channels par odre alphabétique liste des résultats
				setChannels(accessiblesChannelsResponse.data.sort(sortChannelByName))

				setLoaderResultsSearchBar(false)
			}
			catch (error) {
				if (axios.isAxiosError(error)) {
					const axiosError = error as AxiosError<ErrorResponse>
					const { statusCode, message } = axiosError.response?.data!
					if (statusCode === 403)
						displayPopupError({ display: true, message: message })
					else
						displayPopupError({ display: true })
				}
				else
					displayPopupError({ display: true })
			}
		}
		fetchUsersAndChannels()
	}, [userAuthenticate])

	// Filtre les résultats à afficher en fonction de l'input du user
	useEffect(() => {
		setUsersFound(users.filter((user: User) => user.username.startsWith(value)))
		setChannelsFound(channels.filter((channel: Channel) => channel.name.startsWith(value)))
	}, [value])

	// Affiche tout les résultats au premier rendu (sans input du user)
	useEffect(() => {
		setUsersFound(users)
		setChannelsFound(channels)
	}, [users, channels])

	/* ============================== GET DATAS ================================= */

	// Ajoute un user en ami si il ne l'est pas déjà
	async function addUserToFriendList(user: User) {
		try {
			if (!userIsFriend(userAuthenticate, user.id)) {
				await axios.post(`${url}/friends/${user.id}`, {}, {
					headers: {
						'Authorization': `Bearer ${token}`
					}
				})
				setUserAuthenticate((prevState: UserAuthenticate) => ({
					...prevState,
					friends: [...prevState.friends, user]
				}))
				trackEvent("friend-add")
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

	// Join un channel si le user n'est pas ban
	// Si le channel est protected, ouvre le formulaire de saisie de mot de passe
	// Si le user est déjà dans le channel, ouvre le channel dans le chat
	async function addChannelToChannelList(channelId: number) {
		try {
			const channelWithRelationsResponse: AxiosResponse<Channel> = await axios.get(`${url}/channel/${channelId}/relations`, {
				headers: {
					'Authorization': `Bearer ${token}`
				}
			})

			if (userIsInChannel(channelWithRelationsResponse.data, userAuthenticate.id)) {
				setChannelTarget(channelWithRelationsResponse.data)
				displayChat(true)
			}
			else if (userIsBanned(channelWithRelationsResponse.data, userAuthenticate.id))
				displayPopupError({ display: true, message: `You are banned from this channel` })
			else {
				if (channelWithRelationsResponse.data.type === ChannelType.PROTECTED) {
					setChannelTarget(channelWithRelationsResponse.data)
				}
				else {
					await axios.post(`${url}/channel/${channelId}/join`, {}, {
						headers: {
							'Authorization': `Bearer ${token}`
						}
					})
					trackEvent("channel-join")
					setUserAuthenticate((prevState: UserAuthenticate) => ({
						...prevState,
						channels: [...prevState.channels, channelWithRelationsResponse.data]
					}))
					setChannelTarget(() => ({
						...channelWithRelationsResponse.data,
						members: [...channelWithRelationsResponse.data.members, userAuthenticate]
					}))
				}
				displayChat(true)
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

	/* =============================== DISPLAY ================================== */

	const resultsSearchBarRef = useRef<HTMLDivElement>(null)
	const [littleResults, setLittleResults] = useState<boolean>(true)

	// Retire l'avatar et centre le résultat si les sections sont trop petites
	useEffect(() => {
		const resultsSearchBarContainer: HTMLDivElement | null = resultsSearchBarRef.current
		if (resultsSearchBarContainer) {
			if (resultsSearchBarContainer.getBoundingClientRect().width < 152)
				setLittleResults(true)
			else
				setLittleResults(false)
		}
	})

	/* ========================================================================== */

	return (
		<Style ref={resultsSearchBarRef}>
			{
				loaderResultsSearchBar ?
				<NoResult>
					<Loader size={50}/>
				</NoResult>
				:
				<>
					{
						usersFound.length > 0 &&
						<>
							{
								generateResults(usersFound, resultSearchBarType.USER, littleResults, addUserToFriendList)
							}
						</>
					}
					{
						channelsFound.length > 0 &&
						<>
							{
								generateResults(channelsFound, resultSearchBarType.CHANNEL, littleResults, addChannelToChannelList)
							}
						</>
					}
					{
						usersFound.length === 0 && channelsFound.length === 0 &&
						<NoResult>
							No result found
						</NoResult>
					}
				</>
			}
		</Style>
	)
}

export default ResultsSearchBar