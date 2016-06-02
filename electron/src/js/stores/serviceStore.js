import EventEmitter from 'eventemitter3'
import ServiceDispatcher from '../dispatchers/service-dispatcher'
import wailConstants from '../constants/wail-constants'
import {heritrixAccesible} from '../actions/heritrix-actions'
import {waybackAccesible} from '../actions/wayback-actions'

const EventTypes = wailConstants.EventTypes

class serviceStore extends EventEmitter {
   constructor() {
      super()
      this.serviceStatus = {
         heritrix: false,
         wayback: false,

      }
      this.waybackStatus = this.waybackStatus.bind(this)
      this.heritrixStatus = this.heritrixStatus.bind(this)
      this.checkStatues = this.checkStatues.bind(this)
      this.handleEvent = this.handleEvent.bind(this)
   }

   checkStatues() {
      heritrixAccesible()
      waybackAccesible()
   }


   heritrixStatus() {
      return this.serviceStatus.heritrix
   }

   waybackStatus() {
      return this.serviceStatus.wayback
   }

   handleEvent(event) {
      switch (event.type) {
         case EventTypes.HERITRIX_STATUS_UPDATE:
         {
            console.log("Heritrix status update serivice store", event, this.serviceStatus)
            this.serviceStatus.heritrix = event.status
            this.emit('heritrix-status-update')
            break
         }
         case EventTypes.WAYBACK_STATUS_UPDATE:
         {
            console.log("Wayback status update serivice store", event, this.serviceStatus)
            this.serviceStatus.wayback = event.status
            this.emit('wayback-status-update')
            break
         }

      }

   }

}

const ServiceStore = new serviceStore;

ServiceDispatcher.register(ServiceStore.handleEvent)

export default ServiceStore;