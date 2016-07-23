import React, {Component, PropTypes} from 'react'
import lightBaseTheme from 'material-ui/styles/baseThemes/lightBaseTheme'
import getMuiTheme from 'material-ui/styles/getMuiTheme'
import {Grid, Row} from 'react-cellblock'
import {Table, TableBody, TableHeader, TableHeaderColumn, TableRow} from 'material-ui/Table'
import styles from '../../componets/styles/styles'
import CheckOS from './checkOS'
import CheckJava from './checkJava'
import CheckServices from '../shared/checkServices'
import ProgressMessages from '../shared/progressMessages'

const baseTheme = getMuiTheme(lightBaseTheme)

export default class LoadingProgress extends Component {
  static childContextTypes = {
    muiTheme: PropTypes.object.isRequired,
  }

  getChildContext () {
    return { muiTheme: baseTheme }
  }

  render () {
    return (
      <Grid flexible={true}>
        <Row>
          <Table key={'check-table'}>
            <TableHeader
              key={'check-table-header'}
              displaySelectAll={false}
              adjustForCheckbox={false}
              style={styles.tableHeader}
            >
              <TableRow key={'check-table-header-tablerow'} displayBorder={false}>
                <TableHeaderColumn key={'os-check-table-header-thc-os'} style={styles.tableHeaderCol}>
                  Check
                </TableHeaderColumn>
                <TableHeaderColumn key={'check-table-header-thc-complete'} style={styles.tableHeaderCol}>
                  Progress
                </TableHeaderColumn>
              </TableRow>
            </TableHeader>
            <TableBody
              key={'check-table-body'}
              displayRowCheckbox={false}
              showRowHover={true}
            >
              <CheckOS />
              <CheckJava />
              <CheckServices firstLoad={true}/>
            </TableBody>
          </Table>
        </Row>
        <Row>
          <ProgressMessages/>
        </Row>
      </Grid>
    )
  }
}