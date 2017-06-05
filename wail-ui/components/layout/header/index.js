import PropTypes from 'prop-types'
import React, { Component } from 'react'
import routeNames from '../../../routes/routeNames'
import changeLocation from '../../../actions/changeLocation'
import CrawlIndicator from '../crawlingIndicator'
import WailAppBar from './wailAppBar'
import WailAppDrawer from './wailAppDrawer'

export default class Header extends Component {
  static contextTypes = {
    store: PropTypes.object.isRequired
  }

  constructor (props, context) {
    super(props, context)
    this.state = {open: false, location: 'Collections'}
    if (process.env.WAILTEST) {
      window.___header = {
        curState: () => this.state,
        toggle: () => {
          this.handleToggle()
        },
        goHome: () => {
          this.handleClose('Collections', routeNames.selectCol)
        }
      }
    } else if (process.env.NODE_ENV === 'development') {
      window.__openSideBar = (cb) => {
        this.setState({open: !this.state.open}, cb)
      }
    }
  }

  handleToggle () {
    this.setState({open: !this.state.open})
  }

  open (open) {
    this.setState({open})
  }

  handleClose (location, to) {
    // this.context.store.dispatch(changeLocation(to))
    this.setState({open: false, location})
  }

  render () {
    return (
      <div>
        <WailAppBar
          CrawlIndicator={<CrawlIndicator />}
          leftIconTouchTap={::this.handleToggle}
        />
        <WailAppDrawer
          open={this.state.open}
          handleClose={::this.handleClose}
          onRequestChange={::this.handleToggle}
        />
      </div>
    )
  }
}