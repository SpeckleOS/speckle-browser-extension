import * as React from 'react'
import ApiPromise from '@polkadot/api/promise'
import { DerivedReferendumVote } from '@polkadot/api-derive/types'
import { ReferendumInfo, Method, Option, Index, Balance as BalanceType } from '@polkadot/types'
import { RouteComponentProps, withRouter } from 'react-router'
import { ContentContainer } from '../basic-components'
import { IAppState } from '../../background/store/all'
import { connect } from 'react-redux'
import 'react-tippy/dist/tippy.css'
import t from '../../services/i18n'
import AccountDropdown from '../account/AccountDropdown'
import BN = require('bn.js')
import VoteStatus from './VoteStatus'
import styled from 'styled-components'
import { Button } from 'semantic-ui-react'
import { formatBalance, formatNumber } from '@polkadot/util'
import { INITIALIZE_ROUTE, LOGIN_ROUTE } from '../../constants/routes'
import { colorSchemes } from '../styles/themes'
import { isWalletLocked, signExtrinsic } from '../../services/keyring-vault-proxy'
import { SignerOptions } from '@polkadot/api/types'
import { IExtrinsic } from '@polkadot/types/types'
import { setError } from '../../background/store/error'
import { SubmittableExtrinsic } from '@polkadot/api/promise/types'

interface IVoteProps extends StateProps, RouteComponentProps, DispatchProps {
}

interface IBallot {
  voteCount: number
  voteCountAye: number
  voteCountNay: number
  votedAye: BN
  votedNay: BN
  votedTotal: BN
}

interface IVoteState {
  idNumber: number
  ballot: IBallot
  referendumInfo?: ReferendumInfo | undefined
  extrinsic?: IExtrinsic | null
  tries: number
  voteTries: number
  nextTry?: any
  nextVoteTry?: any
  header: string
  documentation?: string | null
}

class Vote extends React.Component<IVoteProps, IVoteState> {

  get api (): ApiPromise {
    const api = this.props.apiContext.api
    if (api) return api
    throw new Error(t('apiError'))
  }

  public state: IVoteState = {
    idNumber: this.props.match.params['proposalId'],
    ballot:  {
      voteCount: 0,
      voteCountAye: 0,
      voteCountNay: 0,
      votedAye: new BN(0),
      votedNay: new BN(0),
      votedTotal: new BN(0)
    },
    tries: 0,
    voteTries: 0,
    referendumInfo: undefined,
    header: '',
    documentation: ''
  }

  componentWillMount (): void {
    if (this.props.settings.selectedAccount == null) {
      this.props.history.push(INITIALIZE_ROUTE)
    }
    isWalletLocked().then(result => {
      if (result) this.props.history.push(LOGIN_ROUTE)
    })
  }

  updateVote = () => {
    console.log('updateVote')
    console.log(this.state.idNumber)
    if (this.props.apiContext.apiReady) {
      this.setState({ ...this.state, tries: 1 })
      this.doUpdate(this.state.idNumber)
    } else if (this.state.voteTries <= 10) {
      const nextTry = setTimeout(this.updateVote, 1000)
      this.setState({ ...this.state, voteTries: this.state.voteTries + 1, nextTry: nextTry })
    } else {
      this.setState({ ...this.state, referendumInfo: undefined })
    }
  }

  doUpdate = async (id) => {
    console.log('doUpdate')
    this.api.query.democracy.referendumInfoOf(id, (referendum: Option<ReferendumInfo>) => {
      const referendumInfo: ReferendumInfo | undefined = referendum.unwrapOr(undefined)
      if (referendumInfo !== this.state.referendumInfo && referendumInfo !== undefined) {
        // Parse referendum info
        const { meta, method, section } = Method.findFunction(referendumInfo.proposal.callIndex)
        const header = `#${this.state.idNumber}: ${section}.${method}`
        const documentation = (meta && meta.documentation) ? (
            meta.documentation.join(' '))
          : null
        this.api.derive.democracy.referendumVotesFor(id).then((votes: DerivedReferendumVote[]) => {
          const newBallot = votes.reduce((ballot: IBallot, { balance, vote }: DerivedReferendumVote): IBallot => {
            if (vote.isAye) {
              ballot.voteCountAye++
              ballot.votedAye = ballot.votedAye.add(balance)
            } else {
              ballot.voteCountNay++
              ballot.votedNay = ballot.votedNay.add(balance)
            }

            ballot.voteCount++
            ballot.votedTotal = ballot.votedTotal.add(balance)

            return ballot
          }, {
            voteCount: 0,
            voteCountAye: 0,
            voteCountNay: 0,
            votedAye: new BN(0),
            votedNay: new BN(0),
            votedTotal: new BN(0)
          })

          if (newBallot !== this.state.ballot) {
            this.setState({
              ...this.state,
              referendumInfo: referendumInfo,
              header: header,
              documentation: documentation,
              ballot: newBallot
            })
          }
        })
      }
    })
  }

  voteAye = () => {
    if (this.props.apiContext.apiReady) {
      this.setState({ ...this.state, tries: 1 })
      this.doVote(this.state.idNumber, true)
    } else if (this.state.tries <= 10) {
      const nextTry = setTimeout(this.voteAye, 1000)
      this.setState({ ...this.state, voteTries: this.state.tries + 1, nextVoteTry: nextTry })
    }
  }

  voteNay = () => {
    if (this.props.apiContext.apiReady) {
      this.setState({ ...this.state, tries: 1 })
      this.doVote(this.state.idNumber, false)
    } else if (this.state.tries <= 10) {
      const nextTry = setTimeout(this.voteAye, 1000)
      this.setState({ ...this.state, voteTries: this.state.tries + 1, nextVoteTry: nextTry })
    }
  }

  doVote = async (id: number, choice: boolean) => {
    const currentAddress = this.props.settings.selectedAccount!.address
    const extrinsic = this.api.tx.democracy.vote(id, choice)

    const signOptions: SignerOptions = {
      blockNumber: (await this.api.query.system.number()) as unknown as BN,
      blockHash: await this.api.genesisHash,
      genesisHash: await this.api.genesisHash,
      nonce: await this.api.query.system.accountNonce(currentAddress) as Index
    }

    signExtrinsic(extrinsic, currentAddress, signOptions).then(signature => {
      const signedExtrinsic = extrinsic.addSignature(
        currentAddress as any,
        signature,
        signOptions.nonce
      )
      return signedExtrinsic
    }).then(async (signedExtrinsic) => {
      if (!signedExtrinsic || !this.props.settings.selectedAccount) {
        return
      }

      const available = await this.api.query.balances.freeBalance(currentAddress) as BalanceType

      if (available.isZero()) {
        this.props.setError('You account has 0 balance.')
        return
      }

      const submittable = signedExtrinsic as SubmittableExtrinsic

      submittable.send().then(() => {
        this.updateVote()
      })
    })

  }

  componentDidMount (): void {
    setTimeout(this.updateVote, 1000)
  }

  componentWillUnmount (): void {
    this.state.nextTry && clearTimeout(this.state.nextTry)
  }

  render () {
    if (!this.props.settings.selectedAccount) {
      return null
    }
    console.log('voteData', this.state.ballot)
    return this.state.referendumInfo !== undefined ? this.renderProposal() : this.renderPlaceHolder()
  }c

  renderPlaceHolder () {
    const { chartColorAye, chartColorNay, backgroundColor } = colorSchemes[this.props.settings.color]
    return (
      <ContentContainer>
        <AccountDropdown/>
        <VoteStatus
          values={[
            {
              colors: chartColorAye,
              label: `Aye`,
              value: new BN(0)
            },
            {
              colors: chartColorNay,
              label: `Nay`,
              value: new BN(0)
            }
          ]}
          votes={0}
          legendColor={backgroundColor}
        />
        <ProposalSection>
          <ProposalDetail/>
        </ProposalSection>
        <ProposalSection>
          <ButtonSection>
            <AyeButton
              color={this.props.settings.color}
              onClick={this.voteAye}
            >
              Aye
            </AyeButton>
            <Button onClick={this.voteNay}>Nay</Button>
          </ButtonSection>
        </ProposalSection>
      </ContentContainer>
    )
  }

  renderProposal () {
    const { chartColorAye, chartColorNay, backgroundColor } = colorSchemes[this.props.settings.color]
    return (
      <ContentContainer>
        <AccountDropdown/>
        <VoteStatus
          values={[
            {
              colors: chartColorAye,
              label: `Aye, ${formatBalance(this.state.ballot.votedAye)} (${formatNumber(this.state.ballot.voteCountAye)})`,
              value: this.state.ballot.voteCount === 0 ? 0 : this.state.ballot.votedAye.muln(10000).div(this.state.ballot.votedTotal).toNumber() / 100
            },
            {
              colors: chartColorNay,
              label: `Nay, ${formatBalance(this.state.ballot.votedNay)} (${formatNumber(this.state.ballot.voteCountNay)})`,
              value: this.state.ballot.voteCount === 0 ? 0 : this.state.ballot.votedNay.muln(10000).div(this.state.ballot.votedTotal).toNumber() / 100
            }
          ]}
          votes={this.state.ballot.voteCount}
          legendColor={backgroundColor}
        />
        <ProposalSection>
          <ProposalDetail>
            <h1>{this.state.header}</h1>
            <summary>{this.state.documentation}</summary>
          </ProposalDetail>
        </ProposalSection>
        <ProposalSection>
          <ButtonSection>
            <AyeButton
              color={this.props.settings.color}
              onClick={this.voteAye}
            >
              Aye
            </AyeButton>
            <Button onClick={this.voteNay}>Nay</Button>
          </ButtonSection>
        </ProposalSection>
      </ContentContainer>
    )
  }
}

const mapStateToProps = (state: IAppState) => {
  return {
    apiContext: state.apiContext,
    settings: state.settings,
    transactions: state.transactions
  }
}

const mapDispatchToProps = { setError }

type StateProps = ReturnType<typeof mapStateToProps>
type DispatchProps = typeof mapDispatchToProps

export default withRouter(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(Vote)
)

const ProposalDetail = styled.div`
  overflow-y: scroll
  height: 150px
  width: 90%
  border: 1px solid #DDD
`

const ProposalSection = styled.div`
  width: 100%
  margin: 8px 0 9px
  display: flex
  justify-content: center
`

const ButtonSection = styled.div`
  width: 90%
  margin: 8px 0 9px
  display: flex
  justify-content: space-between
`

const AyeButton = styled(Button)`
{
cursor: pointer
background-color: ${(props) => colorSchemes[props.color].stopColorOne} !important
padding: .78571429em 1.5em .78571429em
margin: 0 0 0 .25em
font-family: nunito
color: #ffffff
border-radius: 5px
border: none
}
:hover {
background-color: ${(props) => colorSchemes[props.color].stopColorTwo} !important
}
`