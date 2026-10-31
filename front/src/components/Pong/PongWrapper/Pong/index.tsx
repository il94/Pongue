import { trackEvent } from "../../../../lib/analytics"
import  {useState, useEffect, KeyboardEvent, useRef, useContext, Dispatch, SetStateAction } from 'react'

import styled from 'styled-components'
import Paddle from './Paddle'
import Ball from './Ball'
import ScoreWrapper from './ScoreWrapper'
import InteractionContext from "../../../../contexts/InteractionContext"
import { ErrorResponse } from '../../../../utils/types'
import effects from '../../../../utils/effects'
import colors from '../../../../utils/colors'
import CloseButton from '../../../../componentsLibrary/CloseButton'
import axios, { AxiosError } from 'axios'
import AuthContext from '../../../../contexts/AuthContext'
import DisplayContext from '../../../../contexts/DisplayContext'


const Style = styled.div<{ $backgroundColor: string, $w:number, $h:number}>`

	display: flex;
	justify-content: center;


	position: absolute;

	width: ${(props) => props.$w}px; //83.5%
	height: ${(props) => props.$h}px; //83.5%
/* max-width: 83.5%; //83.5% */

/* max-height: 100%; */

/* min-width: 95%; */
/* height: 56.25%; */
/* aspect-ratio: 16/9; */

/* border: 5px;
border-color: white;
border-style: solid;
border-radius: 0.03ch; */

clip-path: ${effects.pixelateWindow};

/* border: 15px solid #ecb54e; */

background-color: ${(props) => props.$backgroundColor};
transition: background-color 1s ease;
`;

// export enum status {
// 	SOLO = "solo",
// 	WAITING = "waiting",
// 	ONGAME = "ongame"
// }


const ResultStyle = styled.div<{ $height: number }>`
	/* position: absolute; */

	margin-top: auto;
	margin-bottom: auto;

	font-size: ${(props) => props.$height / 4}px;

`

type PongProps = {
	width: number,
	height: number,
	score: {
		left: number, right: number
	},
	setScore: Dispatch<SetStateAction<{
		left: number,
		right: number
	}>>,
	setGameState: Dispatch<SetStateAction<boolean>>,
	setSpectate: Dispatch<SetStateAction<boolean>>,
	spectate: boolean;
	social: any;
}

function Pong({ width, height, score, setScore, setGameState, setSpectate, spectate, social}: PongProps){
	
	const { displayPopupError } = useContext(DisplayContext)!

	const user = useContext(InteractionContext)!

	const PongRef = useRef<HTMLDivElement | null>(null)
	
	const [convertionFactor, setConvertionFactor] = useState<number>(0)
	const [backgroundColor, setBackgroundColor] = useState<string>(colors.pongBackground)

	const [PaddlePos, setPaddlePos] = useState<{top: number, bottom: number}>({top: 0, bottom: 0}) //en px
	const [EnemyPaddlePos, setEnemyPaddlePos] = useState<{top: number, bottom: number}>({top: 0, bottom: 0})

	const [Name, setName] = useState<{left: string, right: string}>({left: "", right: ""})
	const { token, url } = useContext(AuthContext)!
	const [ballSize, setBallSize] = useState(25);

	const [gameId, setGameId] = useState(0)
	const [BallPos, setBallPos] = useState ({x: 0, y: 0});

	const [keysPressed, setKeysPressed] = useState<{ [key: string]: boolean }>({}); 

	const [endMessage, setEndMesage] = useState<{display: boolean, message: string}>({display: false, message: "hihi"})

	const handleKeyDown = (event: KeyboardEvent) => {
		
		// console.log("down")
		// event.preventDefault();
		event.stopPropagation();
		
		setKeysPressed((prevKeys) => ({ ...prevKeys, [event.key]: true }));
	};
	
	const handleKeyUp = (event: KeyboardEvent) => {
		
		// console.log("up")
		// event.preventDefault();
		event.stopPropagation();
		
		setKeysPressed((prevKeys) => ({ ...prevKeys, [event.key]: false }));
	};
	
	const updatePositionOnKey = () => {

		if (keysPressed['ArrowUp']) {
			user.userAuthenticate.socket?.emit("paddlemove", "up")
			setTimeout(() => {}, 10)
		}
		if (keysPressed['ArrowDown']) {
			user.userAuthenticate.socket?.emit("paddlemove", "down")
			setTimeout(() => {}, 10)
		}
	};

	const handleStopSpectate = async () => {
		// console.log("u =", user.userAuthenticate.id, "gameid = ",  gameId)
		try {

			await axios.patch(`${url}/pong/stopspectate/${user.userAuthenticate.id}`, 
				{ gameId: gameId},
				{
				headers: {
					'Authorization': `Bearer ${token}`
				}
			})
			setGameState(false)
			setSpectate(false)
			trackEvent("spectate-stop")
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

	const updatePong = (gameID: number, ballPosition: any, myName: string, myPos: any, enemyName: string, enemyPos: any , myScore: number, enemyScore: number) => {
		
		// let ConvertionFactor = PongRef.current?.getBoundingClientRect().height / 1080;
		
		// console.log("pong info update")
		// console.log("convertion factor", convertionFactor)
		//console.log("je rentre dans la function updatePong")
		setBallPos({
			x: ballPosition.x * convertionFactor,
			y: ballPosition.y * convertionFactor
		})
		setPaddlePos({
			top: myPos.top * convertionFactor,
			bottom: myPos.bottom * convertionFactor
		})
		setEnemyPaddlePos({
			top: enemyPos.top * convertionFactor,
			bottom: enemyPos.bottom * convertionFactor
		})
		setBallSize(25 * convertionFactor)
		setScore({left: myScore, right: enemyScore})
		setName({left: myName, right: enemyName})
		setGameId(gameID)
		if ((myScore === 11 || enemyScore === 11))
		{
			if (spectate){
				setGameState(false)
				setSpectate(false)
				return;
			}
			const msg = myScore === 11 ? "Victory !" : "Defeat"
			trackEvent("game-end", { result: myScore === 11 ? "win" : "lose" })
			setEndMesage({display: true, message: msg})
			setTimeout(() => {
				setEndMesage({...endMessage, display: false})
				setGameState(false);
			}, 3000)
		}
	}

	useEffect(() => {
		user.userAuthenticate.socket?.on("pongInfo", updatePong)

		return () => {
			user.userAuthenticate.socket?.off("pongInfo")
		}
	}, [BallPos, PaddlePos, EnemyPaddlePos])

	useEffect(() => {

	// 	const PongContainer = PongRef.current

	// 	if (!spectate && PongContainer)
	// 	{
	// 		PongContainer.addEventListener('mousemove', handlemousMove, true)
	// 		PongContainer.addEventListener('keydown', handleKeyDown, true);
	// 		PongContainer.addEventListener('keyup', handleKeyUp, true);
			
			const animationPaddleId = requestAnimationFrame(updatePositionOnKey);
			return () => {
	// 			PongContainer.removeEventListener('mousemove', handlemousMove, true)
	// 			PongContainer.removeEventListener('keydown', handleKeyDown, true);
	// 			PongContainer.removeEventListener('keyup', handleKeyUp, true);
				cancelAnimationFrame(animationPaddleId);
			};
		// }
		
	}, [keysPressed, PaddlePos]);
	
	useEffect(() => {

		const PongContainer = PongRef.current
		if (PongContainer)
			setConvertionFactor(height / 1080)

	}, [window.innerHeight, window.innerWidth, social, height, width])

	useEffect(() => {
		if (!spectate)
		{
			if (score.left > score.right)
				setBackgroundColor(colors.pongBackgroundWin)
			else if (score.left < score.right)
				setBackgroundColor(colors.pongBackgroundLoose)
			else
				setBackgroundColor(colors.pongBackgroundDraw)
		}
	}, [score])

	// useEffect(() => {
	// 	console.log("in pong width", width)
	// 	console.log("in pong height", height)

	// }, [])

	return (
		<Style $backgroundColor={backgroundColor} $w={width} $h={height} ref={PongRef}>
			{
				!endMessage.display && PongRef.current ? (
					<>
					{
						spectate &&
						<CloseButton closeFunctionAlt={handleStopSpectate} />
					}
					<Paddle Hposition={2} Vposition={(PaddlePos.bottom - (PaddlePos.bottom - PaddlePos.top) / 2)} handleKeyDown={handleKeyDown} handleKeyUp={handleKeyUp} tabIndex={spectate ? -1 : 0} />
					<Ball X={BallPos.x} Y={BallPos.y} BallSize={ballSize}/>

					{/* <NameStyle $Hpos={10} $height={height}>{Name.left}</NameStyle>
					<NameStyle $Hpos={90} $height={height}>{Name.right}</NameStyle> */}
					{/* {spectate && <button onClick={handleStopSpectate}>Spectate</button>} */}
					{/* {spectate && <Button
						onClick={handleStopSpectate}
						type="button" fontSize={"20 px"}
						style={{width: "5%"}}
						title=""
						alt=""
					>Spectate</Button>} */}
					<ScoreWrapper LeftScore={score.left} RightScore={score.right} leftName={Name.left} rightName={Name.right} height={height}/>
					<Paddle Hposition={98} Vposition={(EnemyPaddlePos.bottom - (EnemyPaddlePos.bottom - EnemyPaddlePos.top) / 2)} tabIndex={-1} />
				</> ) :
				<ResultStyle $height={height}>{endMessage.message}</ResultStyle>
			}
		</Style>
	);
}

export default Pong