import React from 'react'
import { TouchableHighlightProps } from 'react-native';
import {SvgProps,} from 'react-native-svg'

import {
    Button,
    ImageContainer,
    Text,
}from './styles'

interface Props extends TouchableHighlightProps{
    title: string;
    svg: React.FC<SvgProps>
}

export function SignInSocialButton({title, svg:Svg, ...rest}: Props){
    return(
        <Button {...rest}>
            <>
                <ImageContainer>
                    <Svg/>
                </ImageContainer>
                <Text>
                    {title}
                </Text>
            </>
        </Button>
    )
}