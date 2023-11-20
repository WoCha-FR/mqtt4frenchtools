#!/usr/bin/env node
const config = require('./lib/config')
const logger = require('./lib/logs')
const MqttClient = require('./lib/mqtt')
const InfosFrance = require('./lib/infofrance')
const InfosVille = require('./lib/infoville')
const _ = require('lodash')

/**
 * Update Data
 */
let lastMinute = 1
let lastMeteoF = 1
let lastHours = new Date().setMinutes(0, 0, 0)
let lastJours = new Date().setHours(0, 0, 0, 0)

function updateData () {
  // 5 Minutes
  if (lastMinute >= 5) {
    for (const key in mesVilles) {
      infoVi.getSunData(mesVilles[key].lat, mesVilles[key].lon, key)
      infoVi.getMoonData(mesVilles[key].lat, mesVilles[key].lon, key)
    }
    lastMinute = 1
  } else {
    lastMinute++
    lastMeteoF++
  }
  // 10 minutes
  if (lastMeteoF >= 10) {
    for (const key in mesVilles) {
      if (!_.isUndefined(config.apikey)) {
        infoVi.getMeteoVigilance(mesVilles[key].dpt, key, config.apikey)
      }
    }
    lastMeteoF = 1
  }
  // 1 Heure
  const curHours = new Date().setMinutes(0, 0, 0)
  if (curHours > lastHours) {
    infoFr.getEDF()
    lastHours = curHours
  }
  // 1 Jour
  const curJours = new Date().setHours(0, 0, 0, 0)
  if (curJours > lastJours) {
    infoFr.getSaints()
    infoFr.getJourSemAn()
    for (const key in mesVilles) {
      infoVi.getJourFerie(mesVilles[key].dpt, key)
      infoVi.getVacances(mesVilles[key].vac, key)
    }
    lastJours = curJours
  }
}
/**
 * Class Init
 */
const infoFr = new InfosFrance()
const infoVi = new InfosVille()
const mesVilles = {}
let intervalId
/**
 * Main function.
 */
async function main () {
  logger.info('Starting French Tools')
  // On lance la machine
  try {
    // mqtt Client
    const mqtt = new MqttClient(config.mqttUrl, config.mqttTopic, config.sslVerify)
    await mqtt.connect()
    // Les infos générales pour la france
    await infoFr.getSaints()
    await infoFr.getJourSemAn()
    await infoFr.getEDF()
    // Les infos par villes
    if (_.isUndefined(config.ville)) {
      logger.warn('Pas de ville à traiter.')
    } else {
      for (let i = 0, len = config.ville.length; i < len; i++) {
        const tempVille = await infoVi.getVille(config.ville[i], false)
        if (!_.isObject(tempVille)) {
          continue
        }
        // on ajoute au tableau
        mesVilles[tempVille.top] = tempVille
        logger.info(`Nouvelle ville: ${tempVille.nom} - Departement: ${tempVille.dpt} - Zone: ${tempVille.vac}`)
        logger.info(`Les données auront comme topic principal: '${config.mqttTopic}/${tempVille.top}'`)
        await infoVi.getVille(config.ville[i], true)
        // Feries
        await infoVi.getJourFerie(tempVille.dpt, tempVille.top)
        // Vacances
        await infoVi.getVacances(tempVille.vac, tempVille.top)
        // Soleil
        await infoVi.getSunData(tempVille.lat, tempVille.lon, tempVille.top)
        // Lune
        await infoVi.getMoonData(tempVille.lat, tempVille.lon, tempVille.top)
        // Vigilance
        if (_.isUndefined(config.apikey)) {
          logger.warn('Pas de vigilance meteo, apikey manquant.')
        } else {
          await infoVi.getMeteoVigilance(tempVille.dpt, tempVille.top, config.apikey)
        }
      }
    }
    // Interval
    intervalId = setInterval(updateData, 60 * 1000)
    process.on('SIGTERM', async () => {
      logger.info('Stopping French Tools')
      clearInterval(intervalId)
      await mqtt.disconnect()
    })
    process.on('SIGINT', async () => {
      logger.info('Stopping French Tools')
      clearInterval(intervalId)
      await mqtt.disconnect(true)
    })
  } catch (e) {
    logger.error('Unable to run => See errors below')
    logger.error(e)
    clearInterval(intervalId)
    process.exit(1)
  }
}
// Call the main code
main()
