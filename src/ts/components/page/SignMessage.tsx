import React, { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import t from '../../services/i18n'
import { IAppState } from '../../background/store/all'
import { connect } from 'react-redux'
import { findNetwork, Network } from '../../constants/networks'
import { Grid } from 'semantic-ui-react'
import { bnToBn } from '@polkadot/util'
import { SignerPayloadJSON } from '@polkadot/types/types'
import BN from 'bn.js'
import { GenericCall, getTypeRegistry } from '@polkadot/types'

interface Decoded {
  json: MethodJson | null
  method: GenericCall | null
}

interface MethodJson {
  args: Record<string, string>
}

const mapStateToProps = (state: IAppState) => {
  return {
    settings: state.settings
  }
}

type StateProps = ReturnType<typeof mapStateToProps>

interface ISignMessageProps extends StateProps {
  isDecoded: boolean
  request: SignerPayloadJSON
}

const decodeMethod = (data: string, isDecoded: boolean, network: Network, specVersion: BN)
  : Decoded => {
  let json: MethodJson | null = null
  let method: GenericCall | null = null

  try {
    if (isDecoded && network.meta && specVersion.eqn(network.specVersion)) {
      getTypeRegistry().register(network.types)
      GenericCall.injectMetadata(network.meta)

      method = new GenericCall(data)
      json = method.toJSON() as unknown as MethodJson
    }
  } catch (error) {
    json = null
    method = null
  }
  return { json, method }
}

const renderMethod = (data: string, { json, method }: Decoded): React.ReactNode => {
  if (!json || !method) {
    return (
      <SignMessageGridRow>
        <Message>{data}</Message>
      </SignMessageGridRow>
    )
  }

  return (
    <SignMessageGridRow>
      <Message>{method.sectionName}.{method.methodName}</Message>
      <Message><pre>{JSON.stringify(json.args, null, 2)}</pre></Message>
    </SignMessageGridRow>
  )
}

const SignMessage = ({ isDecoded, request }: ISignMessageProps) => {
  const { genesisHash, method, specVersion: hexSpec } = request
  const network = useRef(findNetwork(genesisHash)).current
  const specVersion = useRef(bnToBn(hexSpec)).current
  const [decoded, setDecoded] = useState<Decoded>({ json: null, method: null })
  useEffect((): void => {
    setDecoded(decodeMethod(method, isDecoded, network, specVersion))
  }, [isDecoded])

  return (
    <SignMessageGrid centered={true} textAlign='center'>
      <SignMessageGridRow textAlign='left' verticalAlign='top'>
        <SignMessageGridColumn width='12'>
          <Icon><Caption>{t('signingMessageIcon')}</Caption></Icon>
        </SignMessageGridColumn>
        <SignMessageGridColumn width='1'>
          <NetworkIcon src={network.chain.iconUrl} alt='Chain logo'/>
        </SignMessageGridColumn>
        <SignMessageGridColumn width='3'>
          <Network>{network.name}</Network>
        </SignMessageGridColumn>
      </SignMessageGridRow>
      {renderMethod(method, decoded)}
    </SignMessageGrid>
  )
}

const NetworkIcon = styled.img`
  float: right
  height: 20px
  object-fit: contain
`

const Network = styled.span`
  float: right
  height: 18px
  font-family: Nunito
  font-size: 13px
  font-weight: 600
  font-style: normal
  font-stretch: normal
  line-height: normal
  letter-spacing: normal
  color: #000000
`

const Message = styled.span`
  width: 301px
  height: 36px
  font-family: Nunito
  font-size: 13px
  font-weight: normal
  font-style: normal
  font-stretch: normal
  line-height: normal
  letter-spacing: normal
  color: #556267
`

const Caption = styled.span`
  width: 53px
  height: 18px
  font-family: Nunito
  font-size: 13px
  font-weight: bold
  font-style: normal
  font-stretch: normal
  line-height: normal
  letter-spacing: normal
  color: #fcfeff
`

const Icon = styled.div`
  width: 68px
  height: 41px
  background-image: linear-gradient(to bottom, #928bf5, #42b8e9)
  border-bottom-left-radius: 50px
  border-bottom-right-radius: 50px
  text-align: center
`

const SignMessageGrid = styled(Grid)` && {
  display: flex
  height: 100px
  margin: 0 auto
  border-radius: 4px
  box-shadow: 0 2px 8px 0 rgba(62, 88, 96, 0.1)
  background-color: #ffffff
  }
`

const SignMessageGridRow = styled(Grid.Row)` && {
  padding: 0 !important
}
`

const SignMessageGridColumn = styled(Grid.Column)` && {
  padding: 0 !important
}
`

export default connect(mapStateToProps)(SignMessage)
