const axios = require('axios')
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
      result.nbjouran = 366
    } else {
      result.nbjouran = 365
    }
    // Numéro du jour dans l'année
    const debDate = new Date(curDate.getFullYear(), 0, 1)
    const numJour = 1 + Math.ceil((curDate - debDate) / 86400000)
    result.numjouran = numJour
    // Date prochain changement heure
    let dstDate
    if (curDate.getTimezoneOffset() === -120) {
      dstDate = this.getLastDimanche(curDate.getFullYear(), 10)
      const monthjs = dstDate.getMonth() + 1
      const month = (monthjs < 10 ? '0' + monthjs : monthjs)
      result.dstdate = dstDate.getDate() + '/' + month
    } else {
      // Entre Janvier (0) et Mars (2)
      if (curDate.getMonth() <= 2) {
        dstDate = this.getLastDimanche(curDate.getFullYear(), 3)
        const monthjs = dstDate.getMonth() + 1
        const month = (monthjs < 10 ? '0' + monthjs : monthjs)
        result.dstdate = dstDate.getDate() + '/' + month
      } else {
        dstDate = this.getLastDimanche(curDate.getFullYear() + 1, 3)
        const monthjs = dstDate.getMonth() + 1
        const month = (monthjs < 10 ? '0' + monthjs : monthjs)
        result.dstdate = dstDate.getDate() + '/' + month + '/' + dstDate.getFullYear()
      }
    }
    // Difference
    const diffseconds = dstDate.valueOf() - curDate.valueOf()
    const diffjours = Math.trunc(diffseconds / 86400000)
    // On ajout les données
    result.dstdiff = diffjours
    // Numéro de semaine - Modifie curDate
    const dayNumr = (curDate.getDay() + 6) % 7
    curDate.setDate(curDate.getDate() - dayNumr + 3)
    const premJeudi = curDate.valueOf()
    curDate.setMonth(0, 1)
    if (curDate.getDay() !== 4) {
      curDate.setMonth(0, 1 + ((4 - curDate.getDay()) + 7) % 7)
    }
    const tempVal = 1 + Math.ceil((premJeudi - curDate) / 604800000)
    result.numsem = tempVal
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
    let response
    // Couleurs J et J+1
    const date = new Date()
    date.setHours(12, 0, 0, 0)
    const revelant = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate()
    params = { dateRelevant: revelant }
    response = await this.request('searchTempoStore', params)
    if (_.isUndefined(response.couleurJourJ)) {
      logger.warn('Erreur lors de la récupération des couleurs TEMPO')
      result.coulj = 'NO_DATA'
      result.coulj1 = 'NO_DATA'
    } else {
      result.coulj = response.couleurJourJ
      result.coulj1 = response.couleurJourJ1
    }
    // Jours restant Tempo
    params = { TypeAlerte: 'TEMPO' }
    response = await this.request('getNbTempoDays', params)
    if (_.isUndefined(response.PARAM_NB_J_BLEU)) {
      logger.warn('Erreur lors de la récupération des jours TEMPO')
      result.nb_bleu = 'NO_DATA'
      result.nb_blanc = 'NO_DATA'
      result.nb_rouge = 'NO_DATA'
    } else {
      result.nb_bleu = response.PARAM_NB_J_BLEU
      result.nb_blanc = response.PARAM_NB_J_BLANC
      result.nb_rouge = response.PARAM_NB_J_ROUGE
    }
    // Période Tempo
    const mois = date.getMonth()
    if (mois < 8) {
      const past = date.getFullYear() - 1
      result.tempodebut = '01/09/' + past
      result.tempofin = '31/08/' + date.getFullYear()
    } else {
      const next = date.getFullYear() + 1
      result.tempodebut = '01/09/' + date.getFullYear()
      result.tempofin = '31/08/' + next
    }
    // Emit publish Event
    eventEmitter.emit('frame', 'global/edftempo', result)
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
      baseURL: 'https://particulier.edf.fr/services/rest/referentiel',
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
