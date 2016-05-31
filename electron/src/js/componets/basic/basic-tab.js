import React, {Component, PropTypes} from 'react'
import Paper from 'material-ui/Paper'
import {Grid} from 'react-cellblock'
import ArchiveUrl from './archive-url'
import BasicTabButtons from './basicTab-buttons'
import MessagePanel from './message-panel'

const styles = {
   button: {
      margin: 12,
   },
   exampleImageInput: {
      cursor: 'pointer',
      position: 'absolute',
      top: 0,
      bottom: 0,
      right: 0,
      left: 0,
      width: '100%',
      opacity: 0,
   },
}

export default class BasicTab extends Component {
   constructor(props, context) {
      super(props, context)

   }

   render() {
      console.log("HI hellow")
      console.log("hehehe dasass ")
      console.log("hehehe dasass e ")
      return (
         <div>
            <Paper zDepth={3}>
               <Grid>
                  <ArchiveUrl />
                  <BasicTabButtons />
               </Grid>
            </Paper>
            <MessagePanel />
         </div>


      )
   }
}

