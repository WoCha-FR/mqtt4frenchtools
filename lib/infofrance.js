const axios = require('axios')
const axiosRetry = require('axios-retry').default
const fs = require('fs')
const _ = require('lodash')
const logger = require('./logs')
const { eventEmitter } = require('./utils')

class InfosFrance {
  /**
   * Constructor
   *
   * @param {object} requestConfig HTTP request configuration (see https://axios-http.com/docs/req_config)
   */
  constructor (requestConfig = { timeout: 2000 }) {
    this.requestConfig = requestConfig
    // Axios Retry
    axiosRetry(axios, {
      retries: 3,
      retryDelay: (retryCount) => {
        return retryCount * 500
      },
      retryCondition: (e) => {
        if (_.isUndefined(e.response)) {
          return false
        } else {
          return e.response.status === 400
        }
      },
      onRetry: (retryCount, error, requestConfig) => {
        logger.debug('retry count: ' + retryCount)
      }
    })
  }

  /**
   * Saint du jour et du lendemain
   */
  async getSaints () {
    // Ce jour
    const today = new Date()
    const jour = today.getDate() + '-' + (today.getMonth() + 1)
    // Demain
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const demain = tomorrow.getDate() + '-' + (tomorrow.getMonth() + 1)
    // Lecture du fichier
    let data = ''
    try {
      const file = fs.readFileSync('./data/saints.json', 'utf8')
      data = JSON.parse(file)
    } catch (e) {
      logger.error(e)
      return
    }
    // Mise en forme
    const result = {
      saintj: data.court[jour],
      saintj1: data.court[demain],
      saintsj: data.long[jour],
      saintsj1: data.long[demain]
    }
    // Emit publish Event
    eventEmitter.emit('frame', 'global/saints', result)
  }

  /**
   * Informations Jour & annee
   */
  async getJourSemAn () {
    const result = {}
    const curDate = new Date()
    curDate.setHours(0, 0, 0, 0)
    // Année Bissextile ?
    const annee = curDate.getFullYear()
    if (((annee % 4 === 0) && (annee % 100 !== 0)) || (annee % 400 === 0)) {
      result.anNbjour = 366
    } else {
      result.anNbjour = 365
    }
    // Numéro du jour dans l'année
    const debDate = new Date(curDate.getFullYear(), 0, 1)
    const numJour = 1 + Math.ceil((curDate - debDate) / 86400000)
    result.anNumjour = numJour
    // Date prochain changement heure
    let dstDate
    if (curDate.getTimezoneOffset() === -120) {
      dstDate = this.getLastDimanche(curDate.getFullYear(), 10)
      const monthjs = dstDate.getMonth() + 1
      const month = (monthjs < 10 ? '0' + monthjs : monthjs)
      result.dstDate = dstDate.getDate() + '/' + month
    } else {
      // Entre Janvier (0) et Mars (2)
      if (curDate.getMonth() <= 2) {
        dstDate = this.getLastDimanche(curDate.getFullYear(), 3)
        const monthjs = dstDate.getMonth() + 1
        const month = (monthjs < 10 ? '0' + monthjs : monthjs)
        result.dstDate = dstDate.getDate() + '/' + month
      } else {
        dstDate = this.getLastDimanche(curDate.getFullYear() + 1, 3)
        const monthjs = dstDate.getMonth() + 1
        const month = (monthjs < 10 ? '0' + monthjs : monthjs)
        result.dstDate = dstDate.getDate() + '/' + month + '/' + dstDate.getFullYear()
      }
    }
    // Difference
    const diffseconds = dstDate.valueOf() - curDate.valueOf()
    const diffjours = Math.trunc(diffseconds / 86400000)
    // On ajout les données
    result.dstDiff = diffjours
    // Numéro de semaine - Modifie curDate
    const dayNumr = (curDate.getDay() + 6) % 7
    curDate.setDate(curDate.getDate() - dayNumr + 3)
    const premJeudi = curDate.valueOf()
    curDate.setMonth(0, 1)
    if (curDate.getDay() !== 4) {
      curDate.setMonth(0, 1 + ((4 - curDate.getDay()) + 7) % 7)
    }
    const tempVal = 1 + Math.ceil((premJeudi - curDate) / 604800000)
    result.anNumsem = tempVal
    // Emit publish Event
    eventEmitter.emit('frame', 'global/annee', result)
  }

  /**
   * Dernier dimanche d'un mois
   *
   * @param {number} year Année
   * @param {number} month Mois
   * @return {Date} Date du dernier mimanche du mois
   */
  getLastDimanche (year, month) {
    const date = new Date(year, month, 1, 12)
    const semJour = date.getDay()
    const jourDiff = semJour === 0 ? 7 : semJour
    date.setDate(date.getDate() - jourDiff)
    return date
  }

  /**
   * Données EDF pour Tempo
   */
  async getEDF () {
    const result = {}
    let params
    // Jour J
    const date = new Date()
    date.setHours(12, 0, 0, 0)
    const revelant = date.getFullYear() + '-' + ('0' + (date.getMonth() + 1)).slice(-2) + '-' + ('0' + date.getDate()).slice(-2)
    // Demain
    date.setDate(date.getDate() + 1)
    const borneSup = date.getFullYear() + '-' + ('0' + (date.getMonth() + 1)).slice(-2) + '-' + ('0' + date.getDate()).slice(-2)
    // Couleurs
    params = { option: 'TEMPO', dateApplicationBorneInf: revelant, dateApplicationBorneSup: borneSup }
    const response1 = await this.request('calendrier-jours-effacement', params)
    if (_.isEmpty(response1)) {
      logger.warn('Pas de réponse EDF Calendrier Tempo')
    } else {
      if (!_.isEmpty(response1.content) && _.isArray(response1.content.options)) {
        // Parcours Options
        _.each(response1.content.options, (option) => {
          if (option.option === 'TEMPO') {
            _.each(option.calendrier, (data) => {
              if (data.dateApplication === revelant) {
                result.tempoCoulj = data.statut
              }
              if (data.dateApplication === borneSup) {
                result.tempoCoulj1 = data.statut
              }
            })
          }
        })
      } else {
        logger.warn('Erreur EDF Calendrier Tempo')
      }
    }
    // Jours restant Tempo
    params = { option: 'TEMPO', dateReference: revelant }
    const response2 = await this.request('saisons/search', params)
    if (_.isEmpty(response2)) {
      logger.warn('Pas de réponse EDF Jours restant Tempo')
    } else {
      if (_.isArray(response2.content)) {
        _.each(response2.content, (data) => {
          // Bleu
          if (data.typeJourEff === 'TEMPO_BLEU') {
            result.tempoBleuTotal = data.nombreJours
            result.tempoBleuTires = data.nombreJoursTires
            result.tempoBleu = (data.nombreJours - data.nombreJoursTires)
            result.tempoDeb = data.premierJour
            result.tempoFin = data.dernierJour
            result.tempoBleuEtat = data.etat
          }
          if (data.typeJourEff === 'TEMPO_BLANC') {
            result.tempoBlancTotal = data.nombreJours
            result.tempoBlancTires = data.nombreJoursTires
            result.tempoBlanc = (data.nombreJours - data.nombreJoursTires)
            result.tempoBlancDeb = data.premierJour
            result.tempoBlancFin = data.dernierJour
            result.tempoBlancEtat = data.etat
          }
          if (data.typeJourEff === 'TEMPO_ROUGE') {
            result.tempoRougeTotal = data.nombreJours
            result.tempoRougeTires = data.nombreJoursTires
            result.tempoRouge = (data.nombreJours - data.nombreJoursTires)
            result.tempoRougeDeb = data.premierJour
            result.tempoRougeFin = data.dernierJour
            result.tempoRougeEtat = data.etat
          }
        })
      } else {
        logger.warn('Erreur EDF Jours restant Tempo')
      }
    }
    // Emit publish Event
    if (!_.isEmpty(result)) {
      eventEmitter.emit('frame', 'global/edftempo', result)
    }
  }

  /**
   * Axios Request
   *
   * @param {string} path API path
   * @param {object} params Parameters send as query string
   * @return {object|Array} Data in response
   */
  async request (path, params = null) {
    // Axios Config
    const config = {
      ...this.requestConfig,
      method: 'get',
      baseURL: 'https://api-commerce.edf.fr/commerce/activet/v1/',
      url: path,
      headers: {}
    }
    // Parameters
    if (params) {
      config.params = params
    }
    // Get data
    try {
      const result = await axios.request(config)
      return result.data
    } catch (e) {
      // Axios error
      logger.warn(`HTTP request ${path} failed: ${e.message}`)
    }
  }
}

module.exports = InfosFrance
