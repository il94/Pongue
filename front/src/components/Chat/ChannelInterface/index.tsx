import { trackEvent } from "../../../lib/analytics"
import {
	ChangeEvent,
	Dispatch,
	FormEvent,
	SetStateAction,
	useContext,
	useEffect,
	useRef,
	useState
} from "react"
import axios, { AxiosError } from "axios"

import {
	Avatar,
	Style,
	ButtonsWrapper
} from "./style"

import Button from "../../../componentsLibrary/Button"
import Icon from "../../../componentsLibrary/Icon"
import IconUploadFile, { HiddenInput } from "../../../componentsLibrary/IconUploadFile"
import InputText from "../../../componentsLibrary/InputText"
import {
	VerticalSettingWrapper,
	HorizontalSetting,
	HorizontalSettingsForm,
	HorizontalSettingWrapper,
	ErrorMessage
} from "../../../componentsLibrary/SettingsForm/Index"

import InteractionContext from "../../../contexts/InteractionContext"
import AuthContext from "../../../contexts/AuthContext"
import DisplayContext from "../../../contexts/DisplayContext"

import {
	capitalize,
	handleAvatarUpload
} from "../../../utils/functions"

import {
	Channel,
	ErrorResponse,
	SettingAvatar,
	SettingData
} from "../../../utils/types"

import {
	ChannelType,
	chatWindowStatus
} from "../../../utils/status"

import RemoveIcon from "../../../assets/close.png"
import DefaultChannelIcon from "../../../assets/default_channel.png"

type PropsChannelInterface = {
	setBannerName: Dispatch<SetStateAction<string>>,
	chatWindowState: chatWindowStatus,
	setChatWindowState: Dispatch<SetStateAction<chatWindowStatus>>
}

function ChannelInterface({ setBannerName, chatWindowState, setChatWindowState }: PropsChannelInterface) {

	const { token, url } = useContext(AuthContext)!
	const { userAuthenticate, setUserAuthenticate, channelTarget, setChannelTarget } = useContext(InteractionContext)!
	const { displayPopupError } = useContext(DisplayContext)!

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		try {
			event.preventDefault()
			if (!name.value) {
				setName({
					value: '',
					error: true,
					errorMessage: "Insert name",
				})
				return
			}
			else if (!password.value && channelType === ChannelType.PROTECTED) {
				setPassword({
					value: '',
					error: true,
					errorMessage: "Insert password",
				})
				return
			}

			if (name.error || password.error)
				return

			if (chatWindowState === chatWindowStatus.UPDATE_CHANNEL) {
				if (!channelTarget)
					throw new Error

				const newDatas: any = {}

				if (name.value !== channelTarget.name)
					newDatas.name = name.value
				if (channelType !== channelTarget.type)
					newDatas.type = channelType
				if (password.value && channelType == ChannelType.PROTECTED)
					newDatas.hash = password.value
				if (avatar.toDisplay === DefaultChannelIcon)
					newDatas.avatar = `${url}/defaultChannelAvatar/default_channel.png`

				if (Object.keys(newDatas).length !== 0 || avatar.toUpload)
				{
					const multiPartBody: FormData = new FormData()

					if (avatar.toUpload)
						multiPartBody.append('file', avatar.toUpload)
					multiPartBody.append('newDatas', JSON.stringify(newDatas))

					await axios.patch(`${url}/channel/${channelTarget.id}`, multiPartBody, {
						headers: {
							'Authorization': `Bearer ${token}`,
							'Content-Type': 'multipart/form-data'
						}
					})
					trackEvent("channel-settings-update")
				}
				else
					setChatWindowState(chatWindowStatus.CHANNEL)
			}
			else if (chatWindowState === chatWindowStatus.CREATE_CHANNEL) {

				const newDatas: any = {
					name: name.value,
					type: channelType,
					hash: password.value
				}

				const multiPartBody: FormData = new FormData()

				if (avatar.toUpload)
					multiPartBody.append('file', avatar.toUpload)

				multiPartBody.append('newDatas', JSON.stringify(newDatas))

				const postChannelResponse = await axios.post(`${url}/channel`, multiPartBody,
				{
					headers: {
						'Authorization': `Bearer ${token}`,
						'Content-Type': 'multipart/form-data'
					}
				})

				trackEvent("channel-create", { type: channelType })

				const newChannel: Channel = {
					id: postChannelResponse.data.id,
					avatar: postChannelResponse.data.avatar,
					...newDatas,
					messages: [],
					members: [],
					administrators: [],
					owner: userAuthenticate,
					banneds: [],
					muteInfo: []
				}

				setUserAuthenticate((prevState) => ({
					...prevState,
					channels: [...prevState.channels, newChannel]
				}))

				setChannelTarget(newChannel)
			}
		}
		catch (error) {
			if (axios.isAxiosError(error)) {
				const axiosError = error as AxiosError<ErrorResponse>
				const { statusCode, message } = axiosError.response?.data!
				if (statusCode === 403 || statusCode === 404 || statusCode === 422)
					displayPopupError({ display: true, message: message })
				else
					displayPopupError({ display: true })
			}
			else
				displayPopupError({ display: true })
		}
	}

	/* ================================ NAME ==================================== */

	const [name, setName] = useState<SettingData>({
		value: channelTarget && chatWindowState === chatWindowStatus.UPDATE_CHANNEL ? channelTarget.name : '',
		error: false,
		errorMessage: ''
	})

	function handleInputNameChange(event: ChangeEvent<HTMLInputElement>) {
		const value = event.target.value
		if (!value.length) {
			setName({
				value: value,
				error: true,
				errorMessage: "Name cannot be empty"
			})
		}
		else if (value.length > 8) {
			setName((prevState: SettingData) => ({
				...prevState,
				error: true,
				errorMessage: "8 characters max"
			}))
		}
		else {
			setName({
				value: value,
				error: false
			})
			setBannerName(value)
		}
	}

	function handleInputNameBlur() {
		setName((prevState: SettingData) => ({
			...prevState,
			error: false
		}))
	}

	const nameInputTextRef = useRef<HTMLInputElement>(null)

	useEffect(() => {
		const NameInputTextComponent = nameInputTextRef.current

		if (NameInputTextComponent)
			NameInputTextComponent.focus()
	}, [])

	/* =========================== CHANNEL TYPE ================================= */

	const [channelType, setChannelType] = useState<ChannelType>(
		channelTarget && chatWindowState === chatWindowStatus.UPDATE_CHANNEL ?
			channelTarget.type
			:
			ChannelType.PUBLIC
	)

	function handleButtonClick() {
		if (channelType === ChannelType.PUBLIC)
			setChannelType(ChannelType.PROTECTED)
		else if (channelType === ChannelType.PROTECTED)
			setChannelType(ChannelType.PRIVATE)
		else
			setChannelType(ChannelType.PUBLIC)
	}

	/* ============================== PASSWORD ================================== */

	const [password, setPassword] = useState<SettingData>({
		value: '',
		error: false,
		errorMessage: ''
	})

	function handleInputPasswordChange(event: ChangeEvent<HTMLInputElement>) {
		const value = event.target.value
		if (!value.length) {
			setPassword({
				value: value,
				error: true,
				errorMessage: "Password cannot be empty"
			})
		}
		else {
			setPassword({
				value: value,
				error: false
			})
		}
	}

	function handleInputPasswordBlur() {
		setPassword((prevState: SettingData) => ({
			...prevState,
			error: false
		}))
	}

	useEffect(() => {
		if (channelType === ChannelType.PUBLIC
			|| channelType === ChannelType.PRIVATE)
		setPassword({
			value: '',
			error: false
		})
	}, [channelType])

	const [placeHolder, setPlaceHolder] = useState<string>('')

	useEffect(() => {
		if (chatWindowState === chatWindowStatus.UPDATE_CHANNEL
			&& channelType === ChannelType.PROTECTED)
			setPlaceHolder("Old password")
		else
			setPlaceHolder("No password")
	}, [])

	/* =============================== AVATAR =================================== */

	const [avatar, setAvatar] = useState<SettingAvatar>({
		toDisplay: channelTarget && chatWindowState === chatWindowStatus.UPDATE_CHANNEL ?
			channelTarget.avatar
			:
			DefaultChannelIcon,
		toUpload: undefined,
		error: false
	})

	/* ========================================================================== */

	return (
		<Style>
			<HorizontalSettingsForm
				onSubmit={handleSubmit}
				autoComplete="off"
				spellCheck="false">
				<HorizontalSetting>
					Name
					<VerticalSettingWrapper $alignItems={"flex-end"}>
						<InputText
							onChange={handleInputNameChange}
							onBlur={handleInputNameBlur}
							type="text" value={name.value as string}
							width={120}
							fontSize={16}
							$error={name.error}
							ref={nameInputTextRef} />
						<ErrorMessage
							fontSize={10}
							$textAlign="end">
							{name.error && name.errorMessage}
						</ErrorMessage>
					</VerticalSettingWrapper>
				</HorizontalSetting>
				<HorizontalSetting>
					Type
					<Button
						onClick={handleButtonClick}
						type="button" fontSize={"13px"}
						alt="Type channel icon" title="Change type" >
						{capitalize(channelType)}
					</Button>
				</HorizontalSetting>
				<HorizontalSetting $disable={channelType !== ChannelType.PROTECTED}>
					Password
					<VerticalSettingWrapper $alignItems={"flex-end"}>
						<InputText
							onInput={handleInputPasswordChange}
							onClick={() => channelType === ChannelType.PROTECTED && setPlaceHolder('')}
							onBlur={() => {
								setPlaceHolder(
									channelTarget && chatWindowState === chatWindowStatus.UPDATE_CHANNEL ?
										"Old password"
										:
										"No password")
								handleInputPasswordBlur()
							}}
							onFocus={() => {channelType === ChannelType.PROTECTED && setPlaceHolder('')}}
							type="text"
							placeholder={placeHolder}
							value={password.value}
							tabIndex={channelType === ChannelType.PROTECTED ? 0 : 1}
							width={120}
							fontSize={16}
							$disable={channelType !== ChannelType.PROTECTED}
							readOnly={channelType !== ChannelType.PROTECTED} />
						<ErrorMessage
							fontSize={10}>
							{password.error && password.errorMessage}
						</ErrorMessage>
					</VerticalSettingWrapper>
				</HorizontalSetting>
				<HorizontalSetting>
					Avatar
					<HorizontalSettingWrapper width={155}>
						<IconUploadFile
							htmlFor="uploadAvatarChannel" tabIndex={0} fontSize={13}
							alt="Upload icon" title="Upload image">
							&nbsp;Upload&nbsp;
						</IconUploadFile>
						<Icon
							onClick={() => setAvatar({
								toUpload: null,
								toDisplay: DefaultChannelIcon,
								error: false
							})}
							type="button" src={RemoveIcon} size={23}
							alt="Remove icon" title="Remove image" />
						<Avatar
							src={avatar.toDisplay} htmlFor="uploadAvatarChannel" tabIndex={0}
							title="Upload image" />
						<HiddenInput onChange={(event) => handleAvatarUpload(event, setAvatar, displayPopupError)}
							id="uploadAvatarChannel" type="file" accept="image/*" />
					</HorizontalSettingWrapper>
				</HorizontalSetting>
				<ButtonsWrapper>
					<Button
						onClick={() => setChatWindowState(chatWindowStatus.CHANNEL)}
						type="button" fontSize={"14px"}
						alt="Cancel icon" title="Cancel">
						Cancel
					</Button>
					<Button
						type="submit" fontSize={"14px"}
						alt="Create icon" title="Create">
						{
							chatWindowState === chatWindowStatus.CREATE_CHANNEL ?
								"Create"
								:
								"Update"
						}
					</Button>
				</ButtonsWrapper>
			</HorizontalSettingsForm>
		</Style>
	)
}

export default ChannelInterface