import Db from 'nedb'
import Promise from 'bluebird'
import cp from 'child_process'
import path from 'path'
import join from 'joinable'
import S from 'string'
import {remote} from 'electron'
import fs from 'fs-extra'
import moment from 'moment'
import through2 from 'through2'
import prettyBytes from 'pretty-bytes'
import _ from 'lodash'

S.TMPL_OPEN = '{'
S.TMPL_CLOSE = '}'

const settings = remote.getGlobal('settings')

export default class ArchiveManager {
  constructor () {
    this.db = new Db({
      filename: path.join(settings.get('wailCore.db'), 'archives.db'),
      autoload: true
    })
  }

  initialLoad () {
    return this.getAllCollections()
  }

  getAllCollections () {
    return new Promise((resolve, reject) => {
      this.db.find({}, (err, docs) => {
        if (err) {
          reject(err)
        } else {
          if (docs.length === 0) {
            // `${settings.get('warcs')}${path.sep}collections${path.sep}${col}`
            let colpath = path.join(settings.get('warcs'), 'collections', 'default')
            // description: Default Collection
            // title: Default
            let created = moment().format()
            let toCreate = {
              _id: 'default',
              name: 'default',
              colpath,
              archive: path.join(colpath, 'archive'),
              indexes: path.join(colpath, 'indexes'),
              colName: 'default',
              numArchives: 0,
              metadata: { title: 'Default', description: 'Default Collection' },
              crawls: [],
              seeds: [],
              size: '0 B',
              created,
              lastUpdated: created,
              hasRunningCrawl: false
            }
            this.db.insert(toCreate, (err, doc) => {
              if (err) {
                reject(err)
              } else {
                resolve([ doc ])
              }
            })
          } else {
            resolve(docs)
          }
        }
      })
    })
  }

  addCrawlInfo (colName, crawlInfo) {
    console.log('addCrawlInfo ArchiveManager ', colName, crawlInfo)
    return new Promise((resolve, reject) => {
      this.db.update({ colName }, { $push: { crawls: crawlInfo } }, {}, (error, updated) => {
        if (error) {
          console.error('addCrawlInfo error', error)
          return reject(error)
        } else {
          return resolve(updated)
        }
      })
    })
  }

  addInitialMData (col, mdata) {
    let opts = {
      cwd: settings.get('warcs')
    }
    return new Promise((resolve, reject) => {
      let exec = S(settings.get('pywb.addMetadata')).template({ col, metadata: join(...mdata) }).s
      cp.exec(exec, opts, (error, stdout, stderr) => {
        if (error) {
          console.error(stderr)
          return reject(error)
        }
        console.log('added metadata to collection', col)
        console.log('stdout', stdout)
        console.log('stderr', stderr)
        return resolve()
      })
    })
  }

  updateMetadata (update) {
    console.log('updateMetaData', update)
    let { forCol, mdata } = update
    console.log('updateMetaData', forCol, mdata)
    let opts = {
      cwd: settings.get('warcs')
    }
    return new Promise((resolve, reject) => {
      let wasArray = false
      let exec = ''
      if (Array.isArray(mdata)) {
        wasArray = true
        exec = S(settings.get('pywb.addMetadata')).template({ col: forCol, metadata: update.mdataString }).s
      } else {
        exec = S(settings.get('pywb.addMetadata')).template({ col: forCol, metadata: `${mdata.k}="${mdata.v}"` }).s
      }
      console.log(exec)
      cp.exec(exec, opts, (error, stdout, stderr) => {
        console.log(stdout, stderr)
        if (error) {
          console.error(stderr)
          return reject(error)
        }
        this.db.findOne({ colName: forCol }, { metadata: 1, _id: 0 }, (errFind, doc) => {
          if (errFind) {
            console.log('errorfind', errFind)
            return reject(errFind)
          }
          if (wasArray) {
            mdata.forEach(m => {
              let didFind = false
              let len = doc.metadata.length
              for (let i = 0; i < len; ++i) {
                if (doc.metadata[ i ].k === m.k) {
                  doc.metadata[ i ].v = m.v
                  didFind = true
                  break
                }
              }
              if (!didFind) {
                doc.metadata.push(mdata)
              }
            })
          } else {
            let didFind = false
            let len = doc.metadata.length
            for (let i = 0; i < len; ++i) {
              if (doc.metadata[ i ].k === mdata.k) {
                doc.metadata[ i ].v = mdata.v
                didFind = true
                break
              }
            }
            if (!didFind) {
              doc.metadata.push(mdata)
            }
          }

          this.db.update({ colName: forCol }, { $set: { metadata: doc.metadata } }, (errUpdate, numUpdated) => {
            if (errUpdate) {
              console.log('errorUpdate', errFind)
              return reject(errUpdate)
            } else {
              return resolve(doc.metadata)
            }
          })
        })
      })
    })
  }

  addMetadata (col, mdata) {
    let opts = {
      cwd: settings.get('warcs')
    }
    return new Promise((resolve, reject) => {
      let exec = S(settings.get('pywb.addMetadata')).template({ col, metadata: join(...mdata) }).s
      cp.exec(exec, opts, (error, stdout, stderr) => {
        if (error) {
          console.error(stderr)
          return reject(error)
        }
        let metadata = []
        mdata.forEach(m => {
          let split = m.split('=')
          metadata.push({
            k: split[ 0 ],
            v: S(split[ 1 ]).replaceAll('"', '').s
          })
        })
        console.log('added metadata to collection', col)
        console.log('stdout', stdout)
        console.log('stderr', stderr)
        // { $push: { metadata: { $each: mdata } } }
        this.db.update({ colName: col }, { $push: { metadata: { $each: mdata } } }, {}, (err, numUpdated) => {
          if (err) {
            return reject(err)
          } else {
            return resolve(numUpdated)
          }
        })
      })
    })
  }

  getColSize (col) {
    return new Promise((resolve, reject) => {
      let size = 0
      fs.walk(S(settings.get('collections.colWarcs')).template({ col }).s)
        .pipe(through2.obj(function (item, enc, next) {
          if (!item.stats.isDirectory()) this.push(item)
          next()
        }))
        .on('data', item => {
          size += item.stats.size
        })
        .on('end', () => {
          resolve(prettyBytes(size))
        })
    })
  }

  findOne (whichOne) {
    return new Promise((resolve, reject) => {
      this.db.findOne(whichOne, (err, doc) => {
        if (err) {
          reject(err)
        } else {
          resolve(doc)
        }
      })
    })
  }

  update (...args) {
    return new Promise((resolve, reject) => {
      this.db.update(...args, (err, ...rest) => {
        if (err) {
          reject(err)
        } else {
          resolve({ ...rest })
        }
      })
    })
  }

  addWarcsToCol ({ col, warcs, lastUpdated, seed }) {
    console.log('add warcs to col', col)
    let opts = {
      cwd: settings.get('warcs')
    }
    return new Promise((resolve, reject) => {
      // `/home/john/my-fork-wail/bundledApps/pywb/wb-manager add ${id} ${data.existingWarcs}`
      let exec = S(settings.get('pywb.addWarcsToCol')).template({ col, warcs }).s
      cp.exec(exec, opts, (error, stdout, stderr) => {
        if (error) {
          console.error(error)
          console.error(stderr)
          console.error(stdout)
          return reject(error)
        }

        let c1 = ((stdout || ' ').match(/INFO/g) || []).length
        let c2 = ((stderr || ' ').match(/INFO/g) || []).length
        let count = c1 === 0 ? c2 : c1

        console.log('added warcs to collection', col, count)
        console.log('stdout', stdout)
        console.log('stderr', stderr)

        this.getColSize(col)
          .then(size => {
            this.findOne({ colName: col })
              .then(doc => {
                let updateWho = { colName: col }
                if (!_.find(doc.seeds, { url: seed.url })) {
                  console.log('its not in')
                  seed.mementos = 1
                  let theUpdate = {
                    $push: { seeds: seed }, $inc: { numArchives: count }, $set: { size, lastUpdated }
                  }
                  this.update(updateWho, theUpdate, { returnUpdatedDocs: true, multi: false })
                    .then(({ numUpdated, affectedDocuments }) => {
                      console.log(numUpdated, affectedDocuments)
                      resolve({
                        ...affectedDocuments,
                        wasError: false
                      })
                    })
                    .catch(updateErr => reject(updateErr))
                } else {
                  console.log('its in')
                  console.log(doc.seeds)
                  let updatedSeeds = doc.seeds.map(aSeed => {
                    if (aSeed.url === seed.url) {
                      if (!aSeed.jobIds.has(seed.jobId)) {
                        aSeed.jobIds.push(seed.jobId)
                      }
                      aSeed.mementos += 1
                    }
                    return aSeed
                  })
                  let theUpdate = {
                    $set: { seeds: updatedSeeds, size, lastUpdated }, $inc: { numArchives: count },
                  }
                  console.log(updatedSeeds)
                  this.update(updateWho, theUpdate, { returnUpdatedDocs: true, multi: false })
                    .then(({ numUpdated, affectedDocuments }) => {
                      console.log(numUpdated, affectedDocuments)
                      resolve({ ...affectedDocuments, wasError: false })
                    })
                    .catch(updateErr => reject(updateErr))
                }
              })
              .catch(errFind => reject(errFind))
          })
      })
    })
  }

  movePywbStuffForNewCol (col) {
    return new Promise((resolve, reject) => {
      let opts = {
        clobber: true
      }
      let colTemplate = S(settings.get('collections.colTemplate')).template({ col })
      let colStatic = S(settings.get('collections.colStatic')).template({ col })
      fs.copy(settings.get('collections.templateDir'), colTemplate, opts, (errT) => {
        if (errT) {
          console.error('moving templates failed for col', col, errT)
        }
        fs.copy(settings.get('collections.staticsDir'), colStatic, opts, (errS) => {
          if (errS) {
            if (errT) {
              reject({
                errors: 2,
                errS,
                errT
              })
            } else {
              reject({
                errors: 1,
                errS
              })
            }
          } else {
            console.log('moved pywbs stuff for a collection', col)
            resolve()
          }
        })
      })
    })
  }

  createCollection (ncol) {
    let opts = {
      cwd: settings.get('warcs')
    }
    let {
      col,
      metadata
    } = ncol
    let exec = S(settings.get('pywb.newCollection')).template({ col }).s
    return new Promise((resolve, reject) => {
      cp.exec(exec, opts, (error, stdout, stderr) => {
        if (error) {
          console.error(stderr)
          reject(error)
        }
        console.log('created collection', stderr, stdout)
        // `${settings.get('warcs')}${path.sep}collections${path.sep}${col}`
        let colpath = path.join(settings.get('warcs'), 'collections', col)
        let toCreate = {
          _id: col,
          name: col,
          colpath,
          archive: path.join(colpath, 'archive'),
          indexes: path.join(colpath, 'indexes'),
          colName: col,
          numArchives: 0,
          metadata,
          crawls: [],
          hasRunningCrawl: false
        }
        this.db.insert(toCreate, (err, doc) => {
          if (err) {
            reject(err)
          } else {
            resolve(doc)
          }
        })
      })
    })
  }

  find (query) {
    return new Promise((resolve, reject) => {
      this.db.find(query, (err, docs) => {
        if (err) {
          reject(err)
        } else {
          resolve(docs)
        }
      })
    })
  }

  findSelect (query, select) {
    return new Promise((resolve, reject) => {
      this.db.find(query, select, (err, docs) => {
        if (err) {
          reject(err)
        } else {
          resolve(docs)
        }
      })
    })
  }

  get (col) {
    return new Promise((resolve, reject) => {
      this.db.findOne(col, (err, doc) => {
        if (err) {
          reject(err)
        } else {
          resolve(doc)
        }
      })
    })
  }

  getSelect (col, select) {
    return new Promise((resolve, reject) => {
      this.db.findOne(col, select, (err, docs) => {
        if (err) {
          reject(err)
        } else {
          resolve(docs)
        }
      })
    })
  }

  checkWarcsAndReport (forCol) {
    return new Promise((resolve, reject) => {
      this.db.findOne({ _id: forCol }, { archive: 1 }, (err, document) => {
        console.log(document)
      })
    })
  }
}
