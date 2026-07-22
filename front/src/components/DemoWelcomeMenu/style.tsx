import styled from "styled-components"

import colors from "../../utils/colors"
import effects from "../../utils/effects"

export const Style = styled.div`

	display: flex;
	flex-direction: column;
	align-items: center;

	position: absolute;
	top: 50%;
	left: 50%;
	z-index: 9999;
	transform: translate(-50%, -50%);

	width: 380px;

	padding-left: 20px;
	padding-right: 20px;
	padding-bottom: 15px;

	text-align: center;

	clip-path: ${effects.pixelateWindow};

	background-color: ${colors.popup};

`

export const Message = styled.p`

	margin-top: 5px;

`
