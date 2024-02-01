import styled from "styled-components"
import colors from "../../../../utils/colors"

export const Style = styled.div<{ $id: number }>`

	display: flex;
	align-items: center;

	width: 100%;
	height: 40px;
	min-height: 40px;

	cursor: pointer;

	background-color: ${(props) => props.$id % 2 === 0 ? colors.sectionTransparent : colors.sectionAltTransparent};

	&:hover {
		background-color: ${(props) => props.$id % 2 === 0 ? colors.sectionHover : colors.sectionAltHover};
	}
	&:focus-visible {
		outline: none;	
		background-color: ${(props) => props.$id % 2 === 0 ? colors.sectionFocus : colors.sectionAltFocus};
	}

`

export const Avatar = styled.img`
	
	width: 24px;
	height: 24px;

	margin-left: 6px;
	
	border-radius: 50%;

`

export const ChannelName = styled.p`
	
	margin-left: 6px;

	font-size: 12px;

`