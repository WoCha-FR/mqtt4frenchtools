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
    const res = { jourdifference: '- 3m59s', jourduree: '11:34', soleilcoucher: '19:08', soleilelevation: '-46.73', soleilelevzenith: '41.61', soleillever: '7:34', soleilposh: '5.00', soleilposv: '-15.00', soleilzenith: '13:21' }
    const spy = jest.spyOn(eventEmitter, 'emit').mockImplementation(() => {})
    jest.useFakeTimers({ now: new Date(2023, 9, 5) })
    await client.getSunData('43.8146', '7.1621', 'topic')
    expect(spy).toHaveBeenCalledWith('frame', 'topic/soleil', res)
  })
  test('Should return correct sun value for datetime', async () => {
    const res = { jourdifference: '+ 2m55s', jourduree: '13:09', soleilcoucher: '20:08', soleilelevation: '-34.41', soleilelevzenith: '53.99', soleillever: '6:58', soleilposh: '5.00', soleilposv: '-15.00', soleilzenith: '13:33' }
    const spy = jest.spyOn(eventEmitter, 'emit').mockImplementation(() => {})
    jest.useFakeTimers({ now: new Date(2023, 3, 10) })
    await client.getSunData('43.8146', '7.1621', 'topic')
    expect(spy).toHaveBeenCalledWith('frame', 'topic/soleil', res)
  })
  test('Should return correct moon value for Nouvelle lune', async () => {
    const res = { lunelever: '08:07', lunecoucher: '16:51', lunelevation: '-72.65', lunetoujours: 0, luneabsente: 0, lunephase: 'Nouvelle lune' }
    const spy = jest.spyOn(eventEmitter, 'emit').mockImplementation(() => {})
    jest.useFakeTimers({ now: new Date(2023, 0, 21) })
    await client.getMoonData('43.8146', '7.1621', 'topic')
    expect(spy).toHaveBeenCalledWith('frame', 'topic/lune', res)
  })
  test('Should return correct moon value for Premier croissant', async () => {
    const res = { lunelever: '09:54', lunecoucher: '20:49', lunelevation: '-44.46', lunetoujours: 0, luneabsente: 0, lunephase: 'Premier croissant' }
    const spy = jest.spyOn(eventEmitter, 'emit').mockImplementation(() => {})
    jest.useFakeTimers({ now: new Date(2023, 0, 24) })
    await client.getMoonData('43.8146', '7.1621', 'topic')
    expect(spy).toHaveBeenCalledWith('frame', 'topic/lune', res)
  })
  test('Should return correct moon value for Premier quartier', async () => {
    const res = { lunelever: '11:24', lunecoucher: '00:30', lunelevation: '5.17', lunetoujours: 0, luneabsente: 0, lunephase: 'Premier quartier' }
    const spy = jest.spyOn(eventEmitter, 'emit').mockImplementation(() => {})
    jest.useFakeTimers({ now: new Date(2023, 0, 28) })
    await client.getMoonData('43.8146', '7.1621', 'topic')
    expect(spy).toHaveBeenCalledWith('frame', 'topic/lune', res)
  })
  test('Should return correct moon value for Lune croissante', async () => {
    const res = { lunelever: '14:20', lunecoucher: '06:06', lunelevation: '59.45', lunetoujours: 0, luneabsente: 0, lunephase: 'Lune croissante' }
    const spy = jest.spyOn(eventEmitter, 'emit').mockImplementation(() => {})
    jest.useFakeTimers({ now: new Date(2023, 1, 2) })
    await client.getMoonData('43.8146', '7.1621', 'topic')
    expect(spy).toHaveBeenCalledWith('frame', 'topic/lune', res)
  })
  test('Should return correct moon value for Pleine lune', async () => {
    const res = { lunelever: '17:20', lunecoucher: '08:06', lunelevation: '69.45', lunetoujours: 0, luneabsente: 0, lunephase: 'Pleine lune' }
    const spy = jest.spyOn(eventEmitter, 'emit').mockImplementation(() => {})
    jest.useFakeTimers({ now: new Date(2023, 1, 5) })
    await client.getMoonData('43.8146', '7.1621', 'topic')
    expect(spy).toHaveBeenCalledWith('frame', 'topic/lune', res)
  })
  test('Should return correct moon value for Lune decroissante', async () => {
    const res = { lunelever: '20:34', lunecoucher: '09:13', lunelevation: '44.57', lunetoujours: 0, luneabsente: 0, lunephase: 'Lune decroissante' }
    const spy = jest.spyOn(eventEmitter, 'emit').mockImplementation(() => {})
    jest.useFakeTimers({ now: new Date(2023, 1, 8) })
    await client.getMoonData('43.8146', '7.1621', 'topic')
    expect(spy).toHaveBeenCalledWith('frame', 'topic/lune', res)
  })
  test('Should return correct moon value for Dernier quartier', async () => {
    const res = { lunelever: '02:30', lunecoucher: '11:34', lunelevation: '-23.68', lunetoujours: 0, luneabsente: 0, lunephase: 'Dernier quartier' }
    const spy = jest.spyOn(eventEmitter, 'emit').mockImplementation(() => {})
    jest.useFakeTimers({ now: new Date(2023, 1, 14) })
    await client.getMoonData('43.8146', '7.1621', 'topic')
    expect(spy).toHaveBeenCalledWith('frame', 'topic/lune', res)
  })
  test('Should return correct moon value for Dernier croissant', async () => {
    const res = { lunelever: '05:57', lunecoucher: '14:30', lunelevation: '-58.21', lunetoujours: 0, luneabsente: 0, lunephase: 'Dernier croissant' }
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

  beforeAll(async () => {
    mock
      .onGet(baseURL, { params: params1 }).reply(200, { records: [] })
      .onGet(baseURL, { params: params2 }).reply(200, { records: [{ fields: { etat_inondation: 'Vert', etat_vent: 'Jaune', etat_orage: 'Vert', etat_avalanches: 'Vert', etat_pluie_inondation: 'Vert', etat_canicule: 'Vert', etat_neige: 'Vert', etat_vague_submersion: 'Jaune', etat_grand_froid: 'Vert', crue_valeur: 'VIDE', vigilanceconseil_texte: 'VIDE', vigilancecommentaire_texte: 'VIDE' } }] })
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
    const res = { avalanches: 'Vert', canicule: 'Vert', commentaire: 'VIDE', conseil: 'VIDE', crue: 'VIDE', grandfroid: 'Vert', inondation: 'Vert', neige: 'Vert', orage: 'Vert', pluie_inondation: 'Vert', vague_submersion: 'Jaune', vent: 'Jaune' }
    const spy1 = jest.spyOn(logger, 'warn')
    const spy2 = jest.spyOn(eventEmitter, 'emit').mockImplementation(() => {})
    await client.getMeteoVigilance('44.8624', '-0.5848', 'vigimet')
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
    const res = { jourestferie: 0, journomferie: '', prochainfdate: '10/04', prochainfdif: 5, prochainfnom: 'Lundi de Pâques' }
    const spy = jest.spyOn(eventEmitter, 'emit').mockImplementation(() => {})
    jest.useFakeTimers({ now: new Date(2023, 3, 5) })
    await client.getJourFerie('42', 'topic')
    expect(spy).toHaveBeenCalledWith('frame', 'topic/ferie', res)
  })
  test('Should return correct value for Alsace-Moselle', async () => {
    const res = { jourestferie: 1, journomferie: 'Jour de Noël', prochainfdate: '26/12', prochainfdif: 1, prochainfnom: '2ème jour de Noël' }
    const spy = jest.spyOn(eventEmitter, 'emit').mockImplementation(() => {})
    jest.useFakeTimers({ now: new Date(2022, 11, 25) })
    await client.getJourFerie('67', 'topic')
    expect(spy).toHaveBeenCalledWith('frame', 'topic/ferie', res)
  })
  test('Should return correct value for ferie', async () => {
    const res = { jourestferie: 1, journomferie: 'Jour de Noël', prochainfdate: '01/01', prochainfdif: 7, prochainfnom: '1er janvier' }
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
    const res = { jourestvacance: 0, jourfinvacance: -1, journomvacance: '', prochainvacdate: '17/12', prochainvacdif: 12, prochainvacnom: 'Vacances de Noël' }
    const spy = jest.spyOn(eventEmitter, 'emit').mockImplementation(() => {})
    jest.useFakeTimers({ now: new Date(2022, 11, 5) })
    await client.getVacances('A', 'topic')
    expect(spy).toHaveBeenCalledWith('frame', 'topic/vacances', res)
  })
  test('Should return correct value for Zone B', async () => {
    const res = { jourestvacance: 0, jourfinvacance: -1, journomvacance: '', prochainvacdate: '11/02', prochainvacdif: 1, prochainvacnom: "Vacances d'Hiver" }
    const spy = jest.spyOn(eventEmitter, 'emit').mockImplementation(() => {})
    jest.useFakeTimers({ now: new Date(2023, 1, 10) })
    await client.getVacances('B', 'topic')
    expect(spy).toHaveBeenCalledWith('frame', 'topic/vacances', res)
  })
  test('Should return correct value for Zone C', async () => {
    const res = { jourestvacance: 1, jourfinvacance: 3, journomvacance: "Vacances d'Hiver", prochainvacdate: '22/04', prochainvacdif: 49, prochainvacnom: 'Vacances de Printemps' }
    const spy = jest.spyOn(eventEmitter, 'emit').mockImplementation(() => {})
    jest.useFakeTimers({ now: new Date(2023, 2, 3) })
    await client.getVacances('C', 'topic')
    expect(spy).toHaveBeenCalledWith('frame', 'topic/vacances', res)
  })
  test('Should return correct value for Zone CORSE', async () => {
    const res = { jourestvacance: 1, jourfinvacance: 0, journomvacance: 'Vacances de Printemps', prochainvacdate: '17/05', prochainvacdif: 13, prochainvacnom: "Pont de l'Ascension" }
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
