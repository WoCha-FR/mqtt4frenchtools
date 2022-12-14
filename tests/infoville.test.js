/* eslint-disable no-undef */
const axios = require('axios')
const MockAdapter = require('axios-mock-adapter')
const mock = new MockAdapter(axios)

const InfoVille = require('../lib/infoville')
const logger = require('../lib/logs')
const { eventEmitter } = require('../lib/utils')

describe('Create InfosVille', () => {
  test('should set user values when provided', () => {
    const client = new InfoVille({ timeout: 1000 })
    expect(client.requestConfig).toStrictEqual({ timeout: 1000 })
  })
  test('should return a new instance of InfosVille', () => {
    expect(new InfoVille()).toBeInstanceOf(InfoVille)
  })
})

describe('getVille', () => {
  let client
  const baseURL = 'https://geo.api.gouv.fr/communes'
  const params1 = {
    zone: 'metro',
    fields: 'nom,code,centre,departement,region,codesPostaux',
    geometry: 'centre',
    boost: 'population',
    format: 'json',
    nom: 'Dakar'
  }
  const params2 = {
    zone: 'metro',
    fields: 'nom,code,centre,departement,region,codesPostaux',
    geometry: 'centre',
    boost: 'population',
    format: 'json',
    nom: 'Rives'
  }
  const params3 = {
    zone: 'metro',
    fields: 'nom,code,centre,departement,region,codesPostaux',
    geometry: 'centre',
    boost: 'population',
    format: 'json',
    nom: 'Paris'
  }
  const params4 = {
    zone: 'metro',
    fields: 'nom,code,centre,departement,region,codesPostaux',
    geometry: 'centre',
    boost: 'population',
    format: 'json',
    nom: 'Bastia'
  }
  const params5 = {
    zone: 'metro',
    fields: 'nom,code,centre,departement,region,codesPostaux',
    geometry: 'centre',
    boost: 'population',
    format: 'json',
    nom: 'Le Broc',
    codePostal: '06510'
  }
  beforeAll(async () => {
    mock
      .onGet(baseURL, { params: params1 }).reply(200, [])
      .onGet(baseURL, { params: params2 }).reply(200, [{ nom: 'Rives', code: '38337', centre: { type: 'Point', coordinates: [5.4848, 45.3606] }, codesPostaux: ['38140'], departement: { code: '38', nom: 'Isère' }, region: { code: '84', nom: 'Auvergne-Rhône-Alpes' } }, { nom: 'Rives', code: '47223', centre: { type: 'Point', coordinates: [0.7377, 44.6555] }, codesPostaux: ['47210'], departement: { code: '47', nom: 'Lot-et-Garonne' }, region: { code: '75', nom: 'Nouvelle-Aquitaine' } }])
      .onGet(baseURL, { params: params3 }).reply(200, [{ nom: 'Paris', code: '75056', centre: { type: 'Point', coordinates: [2.347, 48.8589] }, codesPostaux: ['75001', '75002'], departement: { code: '75', nom: 'Paris' }, region: { code: '11', nom: 'Île-de-France' } }, { nom: 'Parisot', code: '81202', centre: { type: 'Point', coordinates: [1.8296, 43.7968] }, codesPostaux: ['81310'], departement: { code: '81', nom: 'Tarn' }, region: { code: '76', nom: 'Occitanie' } }])
      .onGet(baseURL, { params: params4 }).reply(200, [{ nom: 'Bastia', code: '2B033', centre: { type: 'Point', coordinates: [9.424, 42.6861] }, codesPostaux: ['20600', '20200'], departement: { code: '2B', nom: 'Haute-Corse' }, region: { code: '94', nom: 'Corse' } }])
      .onGet(baseURL, { params: params5 }).reply(200, [{ nom: 'Le Broc', code: '06025', centre: { type: 'Point', coordinates: [7.1621, 43.8146] }, codesPostaux: ['06510'], departement: { code: '06', nom: 'Alpes-Maritimes' }, region: { code: '93', nom: "Provence-Alpes-Côte d'Azur" } }])
      .onAny().reply(404)
  })
  afterAll(() => {
    mock.reset()
  })
  beforeEach(() => {
    client = new InfoVille()
  })

  test('should return city not found', async () => {
    const spy1 = jest.spyOn(logger, 'warn')
    const res = await client.getVille('Dakar')
    expect(spy1).toHaveBeenCalledWith('Ville inconnue: Dakar')
    expect(res).toStrictEqual(undefined)
  })
  test('should return first city and other possibilities', async () => {
    const spy1 = jest.spyOn(logger, 'warn')
    const res = await client.getVille('Rives')
    expect(spy1).toHaveBeenCalledWith('Autre ville possible: Rives (47) : Utilisez \'47210+Rives\' comme paramètre.')
    expect(res).toStrictEqual({ dpt: '38', lat: 45.3606, lon: 5.4848, nom: 'Rives', top: 'Rives38', vac: 'A' })
  })
  test('should return a city and remove other possibility bad names', async () => {
    const spy1 = jest.spyOn(logger, 'warn')
    const res = await client.getVille('Paris')
    expect(spy1).not.toHaveBeenCalledWith()
    expect(res).toStrictEqual({ dpt: '75', lat: 48.8589, lon: 2.347, nom: 'Paris', top: 'Paris75', vac: 'C' })
  })
  test('should return a city with no other in response', async () => {
    const spy1 = jest.spyOn(logger, 'warn')
    const res = await client.getVille('Bastia')
    expect(spy1).not.toHaveBeenCalledWith()
    expect(res).toStrictEqual({ dpt: '2B', lat: 42.6861, lon: 9.424, nom: 'Bastia', top: 'Bastia2B', vac: 'CORSE' })
  })
  test('should return a city', async () => {
    const spy1 = jest.spyOn(logger, 'warn')
    const res = await client.getVille('06510+Le Broc')
    expect(spy1).not.toHaveBeenCalledWith()
    expect(res).toStrictEqual({ dpt: '06', lat: 43.8146, lon: 7.1621, nom: 'Le Broc', top: 'LeBroc06', vac: 'B' })
  })
})

describe('Sun and Moon', () => {
  let client
  afterAll(() => {
    jest.useRealTimers()
  })
  beforeEach(() => {
    client = new InfoVille()
  })

  test('Should return correct sun value for datetime', async () => {
    const res = { soleilDiff: '-3m59s', soleilDuree: '11:34', soleilCoucher: '19:08', soleilElevation: '-1.38', soleilElevzenith: '41.61', soleilLever: '7:34', soleilPosh: '5.00', soleilPosv: '-15.00', soleilZenith: '13:21' }
    const spy = jest.spyOn(eventEmitter, 'emit').mockImplementation(() => {})
    jest.useFakeTimers({ now: new Date(2023, 9, 5, 7, 30, 0) })
    await client.getSunData('43.8146', '7.1621', 'topic')
    expect(spy).toHaveBeenCalledWith('frame', 'topic/soleil', res)
  })
  test('Should return correct sun value for datetime', async () => {
    const res = { soleilDiff: '+2m55s', soleilDuree: '13:09', soleilCoucher: '20:08', soleilElevation: '53.52', soleilElevzenith: '53.99', soleilLever: '6:58', soleilPosh: '125.19', soleilPosv: '39.52', soleilZenith: '13:33' }
    const spy = jest.spyOn(eventEmitter, 'emit').mockImplementation(() => {})
    jest.useFakeTimers({ now: new Date(2023, 3, 10, 14, 0) })
    await client.getSunData('43.8146', '7.1621', 'topic')
    expect(spy).toHaveBeenCalledWith('frame', 'topic/soleil', res)
  })
  test('Should return correct sun value for datetime', async () => {
    const res = { soleilDiff: '+0m5s', soleilDuree: '15:27', soleilCoucher: '21:18', soleilElevation: '32.54', soleilElevzenith: '69.62', soleilLever: '5:50', soleilPosh: '181.99', soleilPosv: '10.71', soleilZenith: '13:34' }
    const spy = jest.spyOn(eventEmitter, 'emit').mockImplementation(() => {})
    jest.useFakeTimers({ now: new Date(2023, 5, 21, 18, 0) })
    await client.getSunData('43.8146', '7.1621', 'topic')
    expect(spy).toHaveBeenCalledWith('frame', 'topic/soleil', res)
  })
  test('Should return correct moon value for Nouvelle lune', async () => {
    const res = { luneLever: '08:07', luneCoucher: '16:51', luneElevation: '-72.65', luneToujours: 0, luneAbsente: 0, lunePhase: 'Nouvelle lune' }
    const spy = jest.spyOn(eventEmitter, 'emit').mockImplementation(() => {})
    jest.useFakeTimers({ now: new Date(2023, 0, 21) })
    await client.getMoonData('43.8146', '7.1621', 'topic')
    expect(spy).toHaveBeenCalledWith('frame', 'topic/lune', res)
  })
  test('Should return correct moon value for Premier croissant', async () => {
    const res = { luneLever: '09:54', luneCoucher: '20:49', luneElevation: '-44.46', luneToujours: 0, luneAbsente: 0, lunePhase: 'Premier croissant' }
    const spy = jest.spyOn(eventEmitter, 'emit').mockImplementation(() => {})
    jest.useFakeTimers({ now: new Date(2023, 0, 24) })
    await client.getMoonData('43.8146', '7.1621', 'topic')
    expect(spy).toHaveBeenCalledWith('frame', 'topic/lune', res)
  })
  test('Should return correct moon value for Premier quartier', async () => {
    const res = { luneLever: '11:24', luneCoucher: '00:30', luneElevation: '5.17', luneToujours: 0, luneAbsente: 0, lunePhase: 'Premier quartier' }
    const spy = jest.spyOn(eventEmitter, 'emit').mockImplementation(() => {})
    jest.useFakeTimers({ now: new Date(2023, 0, 28) })
    await client.getMoonData('43.8146', '7.1621', 'topic')
    expect(spy).toHaveBeenCalledWith('frame', 'topic/lune', res)
  })
  test('Should return correct moon value for Lune croissante', async () => {
    const res = { luneLever: '14:20', luneCoucher: '06:06', luneElevation: '59.45', luneToujours: 0, luneAbsente: 0, lunePhase: 'Lune croissante' }
    const spy = jest.spyOn(eventEmitter, 'emit').mockImplementation(() => {})
    jest.useFakeTimers({ now: new Date(2023, 1, 2) })
    await client.getMoonData('43.8146', '7.1621', 'topic')
    expect(spy).toHaveBeenCalledWith('frame', 'topic/lune', res)
  })
  test('Should return correct moon value for Pleine lune', async () => {
    const res = { luneLever: '17:20', luneCoucher: '08:06', luneElevation: '69.45', luneToujours: 0, luneAbsente: 0, lunePhase: 'Pleine lune' }
    const spy = jest.spyOn(eventEmitter, 'emit').mockImplementation(() => {})
    jest.useFakeTimers({ now: new Date(2023, 1, 5) })
    await client.getMoonData('43.8146', '7.1621', 'topic')
    expect(spy).toHaveBeenCalledWith('frame', 'topic/lune', res)
  })
  test('Should return correct moon value for Lune decroissante', async () => {
    const res = { luneLever: '20:34', luneCoucher: '09:13', luneElevation: '44.57', luneToujours: 0, luneAbsente: 0, lunePhase: 'Lune decroissante' }
    const spy = jest.spyOn(eventEmitter, 'emit').mockImplementation(() => {})
    jest.useFakeTimers({ now: new Date(2023, 1, 8) })
    await client.getMoonData('43.8146', '7.1621', 'topic')
    expect(spy).toHaveBeenCalledWith('frame', 'topic/lune', res)
  })
  test('Should return correct moon value for Dernier quartier', async () => {
    const res = { luneLever: '02:30', luneCoucher: '11:34', luneElevation: '-23.68', luneToujours: 0, luneAbsente: 0, lunePhase: 'Dernier quartier' }
    const spy = jest.spyOn(eventEmitter, 'emit').mockImplementation(() => {})
    jest.useFakeTimers({ now: new Date(2023, 1, 14) })
    await client.getMoonData('43.8146', '7.1621', 'topic')
    expect(spy).toHaveBeenCalledWith('frame', 'topic/lune', res)
  })
  test('Should return correct moon value for Dernier croissant', async () => {
    const res = { luneLever: '05:57', luneCoucher: '14:30', luneElevation: '-58.21', luneToujours: 0, luneAbsente: 0, lunePhase: 'Dernier croissant' }
    const spy = jest.spyOn(eventEmitter, 'emit').mockImplementation(() => {})
    jest.useFakeTimers({ now: new Date(2023, 1, 17) })
    await client.getMoonData('43.8146', '7.1621', 'topic')
    expect(spy).toHaveBeenCalledWith('frame', 'topic/lune', res)
  })
})

describe('getMeteoVigilance', () => {
  let client
  const baseURL = 'https://data.opendatasoft.com/api/records/1.0/search/'
  const params1 = {
    dataset: 'risques-meteorologiques-copy@public',
    lang: 'fr',
    rows: 1,
    timezone: 'Europe/Paris',
    'geofilter.distance': '30.8086,4.2706'
  }
  const params2 = {
    dataset: 'risques-meteorologiques-copy@public',
    lang: 'fr',
    rows: 1,
    timezone: 'Europe/Paris',
    'geofilter.distance': '44.8624,-0.5848'
  }
  const params3 = {
    dataset: 'risques-meteorologiques-copy@public',
    lang: 'fr',
    rows: 1,
    timezone: 'Europe/Paris',
    'geofilter.distance': '43.8624,0.5848'
  }

  beforeAll(async () => {
    mock
      .onGet(baseURL, { params: params1 }).reply(200, { records: [] })
      .onGet(baseURL, { params: params2 }).reply(200, { records: [{ fields: { etat_inondation: 'Vert', etat_vent: 'Jaune', etat_orage: 'Vert', etat_avalanches: 'Vert', etat_pluie_inondation: 'Vert', etat_canicule: 'Vert', etat_neige: 'Vert', etat_vague_submersion: 'Jaune', etat_grand_froid: 'Vert', crue_valeur: 'VIDE', vigilanceconseil_texte: 'VIDE', vigilancecommentaire_texte: 'VIDE' } }] })
      .onGet(baseURL, { params: params3 }).reply(200, { records: [{ fields: { etat_inondation: 'Vert', etat_vent: 'Jaune', etat_orage: 'Vert', etat_avalanches: 'Vert', etat_pluie_inondation: 'Vert', etat_canicule: 'Vert', etat_neige: 'Vert', etat_vague_submersion: 'Jaune', etat_grand_froid: 'Vert' } }] })
      .onAny().reply(404)
  })
  afterAll(() => {
    mock.reset()
  })
  beforeEach(() => {
    client = new InfoVille()
  })

  test('should return no data on geolfiter not in france', async () => {
    const spy1 = jest.spyOn(logger, 'warn')
    await client.getMeteoVigilance('30.8086', '4.2706', 'vigimet')
    expect(spy1).toHaveBeenCalledWith('Pas de données pour cette position')
  })
  test('should send data for correct geofilter', async () => {
    const res = { vigiAvalanche: 'Vert', vigiCanicule: 'Vert', vigiComment: 'VIDE', vigiConseil: 'VIDE', vigiCrue: 'VIDE', vigiFroid: 'Vert', vigiInondation: 'Vert', vigiNeige: 'Vert', vigiOrage: 'Vert', vigiPluie: 'Vert', vigiVague: 'Jaune', vigiVent: 'Jaune' }
    const spy1 = jest.spyOn(logger, 'warn')
    const spy2 = jest.spyOn(eventEmitter, 'emit').mockImplementation(() => {})
    await client.getMeteoVigilance('44.8624', '-0.5848', 'vigimet')
    expect(spy1).not.toHaveBeenCalled()
    expect(spy2).toHaveBeenCalledWith('frame', 'vigimet/vigilance', res)
  })
  test('should send data for correct geofilter', async () => {
    const res = { vigiAvalanche: 'Vert', vigiCanicule: 'Vert', vigiComment: '', vigiConseil: '', vigiCrue: '', vigiFroid: 'Vert', vigiInondation: 'Vert', vigiNeige: 'Vert', vigiOrage: 'Vert', vigiPluie: 'Vert', vigiVague: 'Jaune', vigiVent: 'Jaune' }
    const spy1 = jest.spyOn(logger, 'warn')
    const spy2 = jest.spyOn(eventEmitter, 'emit').mockImplementation(() => {})
    await client.getMeteoVigilance('43.8624', '0.5848', 'vigimet')
    expect(spy1).not.toHaveBeenCalled()
    expect(spy2).toHaveBeenCalledWith('frame', 'vigimet/vigilance', res)
  })
})

describe('getJourFerie', () => {
  let client
  afterAll(() => {
    jest.useRealTimers()
  })
  beforeEach(() => {
    client = new InfoVille()
  })

  test('Should return correct value for metropole', async () => {
    const res = { ferCejour: 0, ferNom: '', ferProchaindate: '10/04', ferProchainjour: 5, ferProchainnom: 'Lundi de Pâques' }
    const spy = jest.spyOn(eventEmitter, 'emit').mockImplementation(() => {})
    jest.useFakeTimers({ now: new Date(2023, 3, 5) })
    await client.getJourFerie('42', 'topic')
    expect(spy).toHaveBeenCalledWith('frame', 'topic/ferie', res)
  })
  test('Should return correct value for Alsace-Moselle', async () => {
    const res = { ferCejour: 1, ferNom: 'Jour de Noël', ferProchaindate: '26/12', ferProchainjour: 1, ferProchainnom: '2ème jour de Noël' }
    const spy = jest.spyOn(eventEmitter, 'emit').mockImplementation(() => {})
    jest.useFakeTimers({ now: new Date(2022, 11, 25) })
    await client.getJourFerie('67', 'topic')
    expect(spy).toHaveBeenCalledWith('frame', 'topic/ferie', res)
  })
  test('Should return correct value for ferie', async () => {
    const res = { ferCejour: 1, ferNom: 'Jour de Noël', ferProchaindate: '01/01', ferProchainjour: 7, ferProchainnom: '1er janvier' }
    const spy = jest.spyOn(eventEmitter, 'emit').mockImplementation(() => {})
    jest.useFakeTimers({ now: new Date(2022, 11, 25) })
    await client.getJourFerie('38', 'topic')
    expect(spy).toHaveBeenCalledWith('frame', 'topic/ferie', res)
  })
})

describe('getVacances', () => {
  let client
  afterAll(() => {
    jest.useRealTimers()
  })
  beforeEach(() => {
    client = new InfoVille()
  })

  test('Should return correct value Zone A', async () => {
    const res = { vacCejour: 0, vacFin: '', vacNom: '', vacProchaindate: '17/12', vacProchainjour: 12, vacProchainom: 'Vacances de Noël' }
    const spy = jest.spyOn(eventEmitter, 'emit').mockImplementation(() => {})
    jest.useFakeTimers({ now: new Date(2022, 11, 5) })
    await client.getVacances('A', 'topic')
    expect(spy).toHaveBeenCalledWith('frame', 'topic/vacances', res)
  })
  test('Should return correct value for Zone B', async () => {
    const res = { vacCejour: 0, vacFin: '', vacNom: '', vacProchaindate: '11/02', vacProchainjour: 1, vacProchainom: "Vacances d'Hiver" }
    const spy = jest.spyOn(eventEmitter, 'emit').mockImplementation(() => {})
    jest.useFakeTimers({ now: new Date(2023, 1, 10) })
    await client.getVacances('B', 'topic')
    expect(spy).toHaveBeenCalledWith('frame', 'topic/vacances', res)
  })
  test('Should return correct value for Zone C', async () => {
    const res = { vacCejour: 1, vacFin: 3, vacNom: "Vacances d'Hiver", vacProchaindate: '22/04', vacProchainjour: 49, vacProchainom: 'Vacances de Printemps' }
    const spy = jest.spyOn(eventEmitter, 'emit').mockImplementation(() => {})
    jest.useFakeTimers({ now: new Date(2023, 2, 3) })
    await client.getVacances('C', 'topic')
    expect(spy).toHaveBeenCalledWith('frame', 'topic/vacances', res)
  })
  test('Should return correct value for Zone CORSE', async () => {
    const res = { vacCejour: 1, vacFin: 0, vacNom: 'Vacances de Printemps', vacProchaindate: '17/05', vacProchainjour: 13, vacProchainom: "Pont de l'Ascension" }
    const spy = jest.spyOn(eventEmitter, 'emit').mockImplementation(() => {})
    jest.useFakeTimers({ now: new Date(2023, 4, 4) })
    await client.getVacances('CORSE', 'topic')
    expect(spy).toHaveBeenCalledWith('frame', 'topic/vacances', res)
  })
})

describe('Request', () => {
  let client
  beforeAll(async () => {
    mock
      .onGet('/path', { params: { type: 'params' } }).reply(200, { body: [{ type: 'getpublicdata' }] })
      .onGet('/timeout').timeout()
      .onGet('/opendata', { params: { type: 'params' } }).reply(409, { error: 'You have exceeded the requests limit for anonymous users.', errorcode: 10005 })
      .onAny().reply(404)
  })
  afterAll(() => {
    mock.reset()
  })
  beforeEach(() => {
    client = new InfoVille()
  })

  test('should return good result', async () => {
    const res = await client.request('/path', { type: 'params' })
    expect(res).toStrictEqual({ body: [{ type: 'getpublicdata' }] })
  })
  test('should return error in case of timeout', async () => {
    const spy1 = jest.spyOn(logger, 'warn')
    const res = await client.request('/timeout', { type: 'params' })
    expect(spy1).toHaveBeenCalledWith('HTTP request /timeout failed: timeout of 2000ms exceeded')
    expect(res).toStrictEqual(undefined)
  })
  test('should return error in case of Opendatasoft error', async () => {
    const spy1 = jest.spyOn(logger, 'warn')
    const res = await client.request('/opendata', { type: 'params' })
    expect(spy1).toHaveBeenCalledWith('HTTP request /opendata failed: You have exceeded the requests limit for anonymous users. (10005)')
    expect(res).toStrictEqual(undefined)
  })
  test('should print warning in case of bad request', async () => {
    const spy1 = jest.spyOn(logger, 'warn')
    const res = await client.request('/404', { type: 'params' })
    expect(spy1).toHaveBeenCalledWith('HTTP request /404 failed: Request failed with status code 404')
    expect(res).toStrictEqual(undefined)
  })
})
