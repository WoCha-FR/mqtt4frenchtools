/* eslint-disable no-dupe-keys */
const axios = require('axios')
const SunCalc = require('suncalc')
const fs = require('fs')
const _ = require('lodash')
const logger = require('./logs')
const { eventEmitter } = require('./utils')

class InfosVille {
  /**
   * Constructor
   *
   * @param {object} requestConfig HTTP request configuration (see https://axios-http.com/docs/req_config)
   */
  constructor (requestConfig = { timeout: 2000 }) {
    this.requestConfig = requestConfig
  }

  /**
   * Recherche une ville et retourne les informations
   *
   * @param {string} villeStr Ville recherchée
   * @return {object} Données utiles de la ville
   */
  async getVille (villeStr, publishData = false) {
    // Parametres de base
    const params = {
      zone: 'metro',
      fields: 'nom,code,centre,departement,region,codesPostaux',
      geometry: 'centre',
      boost: 'population',
      format: 'json'
    }
    // villeStr avec département
    if (villeStr.charAt(5) === '+') {
      const [cptt, ville] = villeStr.split('+')
      params.nom = ville
      params.codePostal = cptt
    } else {
      params.nom = villeStr
    }
    const response = await this.request('https://geo.api.gouv.fr/communes', params)
    // Pas de résultats
    if (response.length === 0) {
      logger.warn(`Ville inconnue: ${villeStr}`)
      return
    }
    // Premier résultat
    const res = response.shift()
    // Autres résultats possible ?
    if (response.length !== 0) {
      for (const key in response) {
        const other = response[key]
        // Vrai homonyme ?
        if (other.nom !== res.nom) {
          break
        }
        // On averti
        logger.warn(`Autre ville possible: ${other.nom} (${other.departement.code}) : Utilisez '${other.codesPostaux[0]}+${other.nom}' comme paramètre.`)
      }
    }
    // Resultat
    const result = {
      nom: res.nom,
      insee: res.code,
      deptnum: res.departement.code,
      deptnom: res.departement.nom,
      longitude: res.centre.coordinates[0],
      latitude: res.centre.coordinates[1]
    }
    // Zone Scolaire
    const ZoneA = ['01', '03', '07', '15', '16', '17', '19', '21', '23', '24', '25', '26', '33', '38', '39', '40', '42', '43', '47', '58', '63', '64', '69', '70', '71', '73', '74', '79', '86', '87', '89', '90']
    const ZoneC = ['09', '11', '12', '30', '31', '32', '34', '46', '48', '65', '66', '75', '77', '78', '81', '82', '91', '92', '93', '94', '95']
    if (res.region.code === '94') {
      result.zonevacances = 'CORSE'
    } else if (_.includes(ZoneA, res.departement.code)) {
      result.zonevacances = 'A'
    } else if (_.includes(ZoneC, res.departement.code)) {
      result.zonevacances = 'C'
    } else {
      result.zonevacances = 'B'
    }
    // Publish Data
    const topic = res.nom.replace(/[^a-zA-Z]/g, '') + res.departement.code
    if (publishData) {
      eventEmitter.emit('frame', `${topic}/infos`, result)
    }
    // Renvoie
    const ret = {
      nom: res.nom,
      top: topic,
      dpt: res.departement.code,
      lat: res.centre.coordinates[1],
      lon: res.centre.coordinates[0],
      vac: result.zonevacances
    }
    return ret
  }

  /**
   * Infos sur le soleil: lever, coucher, durée du jour
   *
   * @param {number} lat Latitude
   * @param {number} lon Longitude
   * @param {string} topic Main topic to publish to
   */
  async getSunData (lat, lon, topic) {
    const now = new Date()
    now.setHours(12, 0, 0)
    const sunTimes = SunCalc.getTimes(now, lat, lon)
    const sunrise = sunTimes.sunrise.getHours() + ':' + sunTimes.sunrise.getMinutes().toString().padStart(2, '0')
    const sunzenith = sunTimes.solarNoon.getHours() + ':' + sunTimes.solarNoon.getMinutes().toString().padStart(2, '0')
    const sunset = sunTimes.sunset.getHours() + ':' + sunTimes.sunset.getMinutes().toString().padStart(2, '0')
    // Duree du Jour
    const sunrisets = Math.floor(Date.parse(sunTimes.sunrise) / 1000)
    const sunsetts = Math.floor(Date.parse(sunTimes.sunset) / 1000)
    const suninterval = sunsetts - sunrisets
    const minutes = Math.floor((suninterval % 3600) / 60)
    const heures = Math.floor(suninterval / 3600)
    const dureejour = heures + ':' + minutes.toString().padStart(2, '0')
    // Différence avec hier
    let difference
    const hier = new Date()
    hier.setDate(hier.getDate() - 1)
    hier.setHours(12, 0, 0)
    const hsunTimes = SunCalc.getTimes(hier, lat, lon)
    const hsunrisets = Math.floor(Date.parse(hsunTimes.sunrise) / 1000)
    const hsunsetts = Math.floor(Date.parse(hsunTimes.sunset) / 1000)
    const hsuninterval = hsunsetts - hsunrisets
    const hsunecart = suninterval - hsuninterval
    const sunecarts = hsunecart % 60
    const sunecartm = Math.floor((hsunecart % 3600) / 60)
    if (hsunecart > 0) {
      difference = '+' + sunecartm + 'm' + sunecarts + 's'
    } else {
      difference = '-' + Math.abs(sunecartm) + 'm' + Math.abs(sunecarts) + 's'
    }
    // Elevation du soleil
    const lvlzenith = this.getSunElevation(lat, lon, sunTimes.solarNoon)
    const lvlnow = this.getSunElevation(lat, lon)
    // Data widget Jeedom : Vertical
    const calcVerticalSun = ((lvlnow * 55 / lvlzenith) - 15)
    const posVerticalSun = (calcVerticalSun < -15) ? -15 : calcVerticalSun
    // Data widget Jeedom : Horizontal
    const jnow = new Date()
    const jsunrise = sunTimes.sunrise.getHours() * 60 + sunTimes.sunrise.getMinutes()
    const jsunset = sunTimes.sunset.getHours() * 60 + sunTimes.sunset.getMinutes()
    const jminute = jnow.getHours() * 60 + jnow.getMinutes()
    const diff1 = jsunset - jsunrise
    let diff2 = jminute - jsunrise
    if (diff2 < 0 || diff2 > jsunset) diff2 = 0
    const sunpourcent = (diff2 * 100) / diff1
    const calcHorizonSun = (sunpourcent / 100 * 225) + 5
    const posHorizonSun = (calcHorizonSun > 230) ? 230 : calcHorizonSun
    // Prepa des données
    const result = {
      soleilLever: sunrise,
      soleilZenith: sunzenith,
      soleilCoucher: sunset,
      soleilElevation: lvlnow,
      soleilElevzenith: lvlzenith,
      soleilPosv: posVerticalSun.toFixed(2),
      soleilPosh: posHorizonSun.toFixed(2),
      soleilDuree: dureejour,
      soleilDiff: difference
    }
    // Publish Data
    eventEmitter.emit('frame', `${topic}/soleil`, result)
  }

  /**
   * Get sun Elevation in degrees
   *
   * @param {number} lat Latitude
   * @param {number} lon Longitude
   * @param {DateTime} datetime Date object
   * @return {number} Sun elevation in degrees
   */
  getSunElevation (lat, lon, datetime = undefined) {
    if (datetime === undefined) {
      datetime = new Date()
    }
    const data = SunCalc.getPosition(datetime, lat, lon)
    return (data.altitude * (180 / Math.PI)).toFixed(2)
  }

  /**
   * Infos sur la lune: lever, coucher, phase
   *
   * @param {number} lat Latitude
   * @param {number} lon Longitude
   * @param {string} topic Main topic to publish to
   */
  async getMoonData (lat, lon, topic) {
    const now = new Date()
    now.setHours(12, 0, 0)
    const moonTimes = SunCalc.getMoonTimes(now, lat, lon)
    let moonrise = '--:--'
    if (!_.isUndefined(moonTimes.rise)) {
      moonrise = moonTimes.rise.getHours().toString().padStart(2, '0') + ':' + moonTimes.rise.getMinutes().toString().padStart(2, '0')
    }
    let moonset = '--:--'
    if (!_.isUndefined(moonTimes.set)) {
      moonset = moonTimes.set.getHours().toString().padStart(2, '0') + ':' + moonTimes.set.getMinutes().toString().padStart(2, '0')
    }
    const moonup = moonTimes.alwaysUp ? 1 : 0
    const moondown = moonTimes.alwaysDown ? 1 : 0
    // Elevation de la lune
    const lvlnow = this.getMoonElevation(lat, lon)
    // Phase de Lune
    const moonLight = SunCalc.getMoonIllumination(now)
    const moonPhase = moonLight.phase
    const moonFract = (moonLight.fraction * 100)
    let moonTexte = ''
    if (moonFract < 3) {
      moonTexte = 'Nouvelle lune'
    } else if ((moonFract > 2 && moonFract < 35) && moonPhase < 0.5) {
      moonTexte = 'Premier croissant'
    } else if ((moonFract > 2 && moonFract < 35) && moonPhase > 0.5) {
      moonTexte = 'Dernier croissant'
    } else if ((moonFract > 34 && moonFract < 66) && moonPhase < 0.5) {
      moonTexte = 'Premier quartier'
    } else if ((moonFract > 34 && moonFract < 66) && moonPhase > 0.5) {
      moonTexte = 'Dernier quartier'
    } else if ((moonFract > 65 && moonFract < 97) && moonPhase < 0.5) {
      moonTexte = 'Lune croissante'
    } else if ((moonFract > 65 && moonFract < 97) && moonPhase > 0.5) {
      moonTexte = 'Lune decroissante'
    } else {
      moonTexte = 'Pleine lune'
    }
    // Prepa des données
    const result = {
      luneLever: moonrise,
      luneCoucher: moonset,
      luneElevation: lvlnow,
      luneToujours: moonup,
      luneAbsente: moondown,
      lunePhase: moonTexte
    }
    // Publish Data
    eventEmitter.emit('frame', `${topic}/lune`, result)
  }

  /**
   * Get moon Elevation in degrees
   *
   * @param {number} lat Latitude
   * @param {number} lon Longitude
   * @param {DateTime} datetime Date object
   * @return {number} Moon elevation in degrees
   */
  getMoonElevation (lat, lon, datetime) {
    if (datetime === undefined) {
      datetime = new Date()
    }
    const data = SunCalc.getMoonPosition(datetime, lat, lon)
    return (data.altitude * (180 / Math.PI)).toFixed(2)
  }

  /**
   * Recupère les vigilances meteos
   *
   * @param {number} dpt departement
   * @param {string} topic Main topic to publish to
   * @param {string} api APIKey form meteofrance portal
   */
  async getMeteoVigilance (dpt, topic, api) {
    // Variables
    const viginom = { 1: 'vigiVent', 2: 'vigiPluie', 3: 'vigiOrage', 4: 'vigiInondation', 5: 'vigiNeige', 6: 'vigiCanicule', 7: 'vigiFroid', 8: 'vigiAvalanche', 9: 'vigiVague' }
    const couleur = { 1: 'Vert', 2: 'Jaune', 3: 'Orange', 4: 'Rouge' }
    const result = {}
    // Requete
    const params = {
      apikey: api
    }
    const response = await this.request('https://public-api.meteofrance.fr/public/DPVigilance/v1/cartevigilance/encours', params)
    if (_.isUndefined(response.product) || _.isUndefined(response.product.periods)) {
      logger.warn('Pas de données de vigilance')
      return
    }
    // Parcours des periods
    for (const key in response.product.periods) {
      const period = response.product.periods[key]
      if (period.echeance !== 'J') {
        break
      }
      // Parcours des timelaps.domain_ids
      for (const key2 in period.timelaps.domain_ids) {
        const domain = period.timelaps.domain_ids[key2]
        // Données du departement domain 1 à 7
        if (domain.domain_id === dpt) {
          // Parcours des phenomenon_items
          for (const key3 in domain.phenomenon_items) {
            const phenomenon = domain.phenomenon_items[key3]
            result[viginom[phenomenon.phenomenon_id]] = couleur[phenomenon.phenomenon_max_color_id]
          }
        }
        // Données du departement domain 8 et 9
        if (domain.domain_id === dpt + '10') {
          // Parcours des phenomenon_items
          for (const key3 in domain.phenomenon_items) {
            const phenomenon = domain.phenomenon_items[key3]
            result[viginom[phenomenon.phenomenon_id]] = couleur[phenomenon.phenomenon_max_color_id]
          }
        }
      }
    }
    // Publish Data
    if (_.isEmpty(result)) {
      logger.warn('Pas de données de vigilance')
    } else {
      eventEmitter.emit('frame', `${topic}/vigilance`, result)
    }
  }

  /**
   * Informations jours feries
   *
   * @param {number} dept Departement pour la recherche
   * @param {string} topic Main topic to publish to
   */
  async getJourFerie (dept, topic) {
    const curDate = new Date()
    curDate.setHours(0, 0, 0, 0)
    let filename = './data/metropole.json'
    // Fichier spécial Alsace-Moselle
    if (dept === '57' || dept === '67' || dept === '68') {
      filename = './data/alsace.json'
    }
    // Lecture du fichier
    let data = ''
    try {
      const file = fs.readFileSync(filename, 'utf8')
      data = JSON.parse(file)
    } catch (e) {
      console.error(e)
    }
    // Valeurs par défaut
    const feries = {
      ferCejour: 0,
      ferNom: '',
      ferProchaindate: '01/01',
      ferProchainnom: 'Non Trouvé',
      ferProchainjour: -1
    }
    // Parcours
    for (const key in data) {
      const tempDate = new Date(key)
      tempDate.setHours(0, 0, 0, 0)
      // Jour J est un Jour Ferié
      if (Date.parse(curDate) === Date.parse(tempDate)) {
        feries.ferCejour = 1
        feries.ferNom = data[key]
      }
      // Prochain Jour Ferié
      if (curDate < tempDate) {
        // Infos
        feries.ferProchaindate = tempDate.getDate().toString().padStart(2, '0') + '/' + (tempDate.getMonth() + 1).toString().padStart(2, '0')
        feries.ferProchainnom = data[key]
        // Difference
        const diffseconds = tempDate.valueOf() - curDate.valueOf()
        const diffjours = Math.trunc(diffseconds / 86400000)
        feries.ferProchainjour = diffjours
        break
      }
    }
    // Publish Data
    eventEmitter.emit('frame', `${topic}/ferie`, feries)
  }

  /**
   * Informations vacances
   *
   * @param {string} zone Zone scolaire à rechercher
   * @param {string} topic Main topic to publish to
   */
  async getVacances (zone, topic) {
    const curDate = new Date()
    const filename = './data/vacances.json'
    // Lecture du fichier
    let tempdata = ''
    try {
      const file = fs.readFileSync(filename, 'utf8')
      tempdata = JSON.parse(file)
    } catch (e) {
      console.error(e)
    }
    const data = tempdata[zone]
    // Valeurs par défaut
    const vacances = {
      vacCejour: 0,
      vacNom: '',
      vacFin: '',
      vacProchaindate: '',
      vacProchainom: 'Non Trouvé',
      vacProchainjour: -1
    }
    // Parcours
    for (const key in data) {
      const startDate = new Date(data[key].debut)
      const stopDate = new Date(data[key].fin)
      // Jour J est pendant les vacances
      if (startDate < curDate && stopDate > curDate) {
        vacances.vacCejour = 1
        vacances.vacNom = data[key].nom
        // Calcul fin des vacances
        const difffinseconds = stopDate.valueOf() - curDate.valueOf()
        const difffinjours = Math.trunc(difffinseconds / 86400000)
        vacances.vacFin = difffinjours
      }
      // Prochaines Vacances
      if (startDate > curDate) {
        vacances.vacProchaindate = startDate.getDate().toString().padStart(2, '0') + '/' + (startDate.getMonth() + 1).toString().padStart(2, '0')
        vacances.vacProchainom = data[key].nom
        // Difference
        const diffseconds = startDate.valueOf() - curDate.valueOf()
        const diffjours = Math.trunc(diffseconds / 86400000)
        vacances.vacProchainjour = diffjours
        break
      }
    }
    // Publish Data
    eventEmitter.emit('frame', `${topic}/vacances`, vacances)
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
      // MeteoFrance API
      if (e.response && e.response.status && e.response.data && e.response.data.includes('Invalid Credentials')) {
        logger.warn(`HTTP request ${path} failed: Invalid Credentials. Make sure you have provided the correct security credentials`)
        return {}
      }
      // Axios error
      logger.warn(`HTTP request ${path} failed: ${e.message}`)
    }
  }
}

module.exports = InfosVille
