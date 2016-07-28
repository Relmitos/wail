import React, { Component, PropTypes } from 'react'
import autobind from 'autobind-decorator'
import { remote } from 'electron'
import MenuItem from 'material-ui/MenuItem'
import {ListItem} from 'material-ui/List'
import _ from 'lodash'
import { grey400 } from 'material-ui/styles/colors'
import IconButton from 'material-ui/IconButton'
import MoreVertIcon from 'material-ui/svg-icons/navigation/more-vert'
import IconMenu from 'material-ui/IconMenu'
import ArrowDropRight from 'material-ui/svg-icons/navigation-arrow-drop-right'


// const settings = remote.getGlobal('settings')
const { dialog } = remote

const style = {
  cursor: 'pointer'
}

export default class FSLocationChooser extends Component {
  static propTypes = {
    whichSetting: PropTypes.string.isRequired,
    warnOnChange: PropTypes.bool.isRequired,
    settings: PropTypes.object.isRequired
  }

  constructor (props, context) {
    super(props, context)
    this.state = {
      settingValue: this.props.settings.get(props.whichSetting),
      originalValue: this.props.settings.get(props.whichSetting),
      didModify: false
    }
  }

  @autobind
  changeLocation (event) {
    dialog.showOpenDialog({
      title: 'Choose Location',
      defaultPath: this.state.settingValue,
      properties: [ 'openDirectory', 'createDirectory' ]
    }, (settingValue) => {
      if (settingValue) {
        // settings.set(this.props.whichSetting, path)
        console.log(settingValue)
        this.setState({ settingValue })
      }
    })
  }

  @autobind
  revert (event) {
    this.props.settings.set(this.props.whichSetting, this.state.originalValue)
    this.setState({ settingValue: this.state.originalValue })
  }
  /*
   <TableRow key={this.props.whichSetting}>
   <TableRowColumn style={styles.settingsCol}>
   {`${ _.upperCase(this.props.whichSetting) } Path`}
   </TableRowColumn>
   <TableRowColumn>
   {this.state.settingValue}
   </TableRowColumn>
   <TableRowColumn style={styles.settingsActionCol}>
   <RaisedButton
   label={"Change"}
   primary={true}
   labelPosition={'before'}
   onMouseDown={this.changeLocation}
   />
   <RaisedButton
   label={"Revert"}
   style={styles.settingsButton}
   labelPosition={'before'}
   onMouseDown={this.revert}
   />
   </TableRowColumn>
   </TableRow>
   */

  render () {
    const actionIcon = (
      <IconButton
        touch={true}
        tooltip='Actions'
        tooltipPosition="bottom-left"
      >
        <MoreVertIcon color={grey400}/>
      </IconButton>
    )

    const rightIconMenu = (
      <IconMenu
        iconButtonElement={actionIcon}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        targetOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        <MenuItem style={style} onTouchTap={this.changeLocation} primaryText='Change Location'/>
        <MenuItem style={style} onTouchTap={this.revert} primaryText='Revert To Default'/>
      </IconMenu>
    )
    return (
      <ListItem
        key={`fslc-li-${this.props.whichSetting}`}
        primaryText={`${ _.upperCase(this.props.whichSetting) } Path`}
        rightIconButton={rightIconMenu}
        secondaryText={this.state.settingValue}
      />
    )
  }
}
