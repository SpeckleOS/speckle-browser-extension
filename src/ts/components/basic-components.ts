import styled from 'styled-components'
import { colorSchemes } from './styles/themes'
import { IAppState } from '../background/store/all'
import { connect } from 'react-redux'
import { Button as SemanticButton, Dropdown, Input, Image } from 'semantic-ui-react'
import Header from 'semantic-ui-react/dist/commonjs/elements/Header/Header'
import Identicon from 'polkadot-identicon'

const mapStateToProps = (state: IAppState) => {
  return {
    settings: state.settings
  }
}

type P = ReturnType<typeof mapStateToProps>

export const LayoutContainer = styled('div')`
    width: 375px
    height: 600px
    border-radius: 4px
    box-shadow: 0 6px 30px 0 ${props => props.theme['shadowColor']}
    border: 0
    background-color: ${props => props.theme['backgroundColor']}
`

const StyledButton = styled(SemanticButton).attrs({ fluid: true })`
  box-shadow: 0 3px 10px 0 ${(p: P) => colorSchemes[p.settings.color].shadowColor} !important
  background-color: ${(p: P) => colorSchemes[p.settings.color].backgroundColor} !important
  color: #ffffff !important
`

export const Button = connect(mapStateToProps)(StyledButton)

export const ContentContainer = styled.div`
  width: 311px
  margin: 0 auto
`

export const Section = styled.div`
  width: 100%
  margin: 18px 0
  text-align: center
  word-wrap: break-word
`

export const TopSection = styled(Section)`
  margin-top: 0
`

export const PrimaryText = styled.div`
  color: #30383B
`

export const SecondaryText = styled.div`
  opacity: 0.6
  color: #3e5860
`

export const Title = styled.div`
  font-size: 19px
  font-weight: bold
  color: #30383B
  text-align: center
`

export const MnemonicPad = styled.textarea`
  height: 100px
  line-height: 1.57
  color: #30383b
  line-height 1.8rem
  word-spacing: 5px
`

export const StyledPassword = styled(Input).attrs({ fluid: true })`
  height: 42px
`

export const DropdownItemContainer = styled.div`
  width: 212px

`

export const DropdownItemContent = styled.div`
  float: right
`

export const DropdownItemHeader = styled(Header)`
  width: 150px
  height: 14px
  font-family: Nunito
  font-size: 10px !important
  font-weight: bold
  font-style: normal
  font-stretch: normal
  line-height: normal
  letter-spacing: normal
  color: #ffffff !important
`

export const DropdownItemIdenticon = styled(Identicon)`
  display: inline;
`

export const StyledDropdownDivider = styled(Dropdown.Divider)`
    height: 0.5px !important
    background-color: #ffffff
`

export const DropdownItemIconImage = styled(Image)`
  display: inline !important
  width: 16px
  height: 16px
`

export const AccountAddress = styled.div`
  height: 14px;
  font-family: Nunito;
  font-size: 10px;
  font-weight: normal;
  font-style: normal;
  font-stretch: normal;
  line-height: normal;
  letter-spacing: normal;
  text-align: center;
  color: #ffffff;
`

export const DropdownItemSubHeader = styled.span`
  width: 85px;
  height: 9px;
  font-family: Nunito;
  font-size: 7px;
  font-weight: normal;
  font-style: normal;
  font-stretch: normal;
  line-height: normal;
  letter-spacing: normal;
  text-align: center;
  color: #ffffff;
`

export const StyledMyAccountDropdown = styled(Dropdown)`
    width: 200px
    height: 26px
    margin: 0 auto
    font-family: Nunito
    font-size: 19px
    font-weight: bold
    font-style: normal
    font-stretch: normal
    line-height: normal
    letter-spacing: normal
    color: #ffffff

    & .menu {
      background-color: ${(p: P) => colorSchemes[p.settings.color].backgroundColor} !important
    }

    & .item {
      height: 32px
    }

    & .divider {
      height: 2px
    }
`

export const MyAccountDropdown = connect(mapStateToProps)(StyledMyAccountDropdown)

export const LoginFooter = styled.div`
  position: absolute
  bottom: 0
  width: 40%
  height: 25px
  font-size: 11px
  margin: 0 120px
  display: flex
  justify-content: space-around
`

const StyledLink = styled.a`
  color: ${(p: P) => colorSchemes[p.settings.color].backgroundColor} !important
`

export const FooterLink = connect(mapStateToProps)(StyledLink)

export const Center = styled.div`
  text-align: center
`
