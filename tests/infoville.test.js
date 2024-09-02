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
    const res = await client.getVille('Rives', true)
    expect(spy1).toHaveBeenCalledWith('Autre ville possible: Rives (47) : Utilisez \'47210+Rives\' comme paramètre.')
    expect(res).toStrictEqual({ dpt: '38', lat: 45.3606, lon: 5.4848, nom: 'Rives', top: 'Rives38', vac: 'A' })
  })
  test('should return a city and remove other possibility bad names', async () => {
    const spy1 = jest.spyOn(logger, 'warn')
    const res = await client.getVille('Paris', true)
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
    const res = await client.getVille('06510+Le Broc', true)
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
  const baseURL = 'https://public-api.meteofrance.fr/public/DPVigilance/v1/cartevigilance/encours'
  const params1 = { apikey: 'nodata1' }
  const params2 = { apikey: 'nodata2' }
  const params3 = { apikey: 'testretour1' }
  const params4 = { apikey: 'testretour2' }
  const params5 = { apikey: 'testretour3' }
  const params6 = { apikey: 'reponsej1' }
  const params7 = { apikey: 'multivagues1' }
  const params8 = { apikey: 'multivagues2' }
  const params9 = { apikey: 'multivagues3' }
  const param10 = { apikey: 'testretour4' }
  const param11 = { apikey: 'testvague4' }
  const param12 = { apikey: 'testvague5' }
  const param13 = { apikey: 'testvague6' }

  beforeAll(async () => {
    mock
      .onGet(baseURL, { params: params1 }).reply(200, {})
      .onGet(baseURL, { params: params2 }).reply(200, { test: 'empty' })
      .onGet(baseURL, { params: params3 }).reply(200, { product: { periods: [{ echeance: 'J', begin_validity_time: '2023-11-16T05:00:00Z', end_validity_time: '2023-11-16T23:00:00Z', timelaps: { domain_ids: [{ domain_id: '42', max_color_id: 2, phenomenon_items: [{ phenomenon_id: '1', phenomenon_max_color_id: 2, timelaps_items: [{ begin_time: '2023-11-16T05:00:00Z', end_time: '2023-11-16T10:00:00Z', color_id: 1 }, { begin_time: '2023-11-16T10:00:00Z', end_time: '2023-11-16T22:00:00Z', color_id: 2 }, { begin_time: '2023-11-16T22:00:00Z', end_time: '2023-11-16T23:00:00Z', color_id: 1 }] }, { phenomenon_id: '4', phenomenon_max_color_id: 2, timelaps_items: [] }, { phenomenon_id: '3', phenomenon_max_color_id: 1, timelaps_items: [{ begin_time: '2023-11-16T05:00:00Z', end_time: '2023-11-16T23:00:00Z', color_id: 1 }] }, { phenomenon_id: '2', phenomenon_max_color_id: 1, timelaps_items: [{ begin_time: '2023-11-16T05:00:00Z', end_time: '2023-11-16T23:00:00Z', color_id: 1 }] }, { phenomenon_id: '5', phenomenon_max_color_id: 1, timelaps_items: [{ begin_time: '2023-11-16T05:00:00Z', end_time: '2023-11-16T23:00:00Z', color_id: 1 }] }, { phenomenon_id: '7', phenomenon_max_color_id: 1, timelaps_items: [{ begin_time: '2023-11-16T05:00:00Z', end_time: '2023-11-16T23:00:00Z', color_id: 1 }] }] }] } }, { echeance: 'J1', begin_validity_time: '2023-11-16T23:00:00Z', end_validity_time: '2023-11-17T23:00:00Z', timelaps: { domain_ids: [{ domain_id: '42', max_color_id: 2, phenomenon_items: [{ phenomenon_id: '1', phenomenon_max_color_id: 1, timelaps_items: [{ begin_time: '2023-11-16T23:00:00Z', end_time: '2023-11-17T11:00:00Z', color_id: 1 }, { begin_time: '2023-11-17T11:00:00Z', end_time: '2023-11-17T18:00:00Z', color_id: 2 }, { begin_time: '2023-11-17T18:00:00Z', end_time: '2023-11-17T23:00:00Z', color_id: 1 }] }, { phenomenon_id: '4', phenomenon_max_color_id: 2, timelaps_items: [] }, { phenomenon_id: '3', phenomenon_max_color_id: 2, timelaps_items: [{ begin_time: '2023-11-16T23:00:00Z', end_time: '2023-11-17T14:00:00Z', color_id: 1 }, { begin_time: '2023-11-16T14:00:00Z', end_time: '2023-11-17T17:00:00Z', color_id: 2 }, { begin_time: '2023-11-16T17:00:00Z', end_time: '2023-11-17T23:00:00Z', color_id: 1 }] }, { phenomenon_id: '2', phenomenon_max_color_id: 1, timelaps_items: [{ begin_time: '2023-11-16T23:00:00Z', end_time: '2023-11-17T23:00:00Z', color_id: 1 }] }, { phenomenon_id: '5', phenomenon_max_color_id: 1, timelaps_items: [{ begin_time: '2023-11-16T23:00:00Z', end_time: '2023-11-17T23:00:00Z', color_id: 1 }] }, { phenomenon_id: '7', phenomenon_max_color_id: 1, timelaps_items: [{ begin_time: '2023-11-16T23:00:00Z', end_time: '2023-11-17T23:00:00Z', color_id: 1 }] }] }] } }] } })
      .onGet(baseURL, { params: params4 }).reply(200, { product: { periods: [{ echeance: 'J', begin_validity_time: '2023-11-16T05:00:00Z', end_validity_time: '2023-11-16T23:00:00Z', timelaps: { domain_ids: [{ domain_id: '06', max_color_id: 2, phenomenon_items: [{ phenomenon_id: '1', phenomenon_max_color_id: 2, timelaps_items: [{ begin_time: '2023-11-16T05:00:00Z', end_time: '2023-11-16T20:00:00Z', color_id: 1 }, { begin_time: '2023-11-16T20:00:00Z', end_time: '2023-11-16T23:00:00Z', color_id: 2 }] }, { phenomenon_id: '4', phenomenon_max_color_id: 1, timelaps_items: [] }, { phenomenon_id: '3', phenomenon_max_color_id: 1, timelaps_items: [{ begin_time: '2023-11-16T05:00:00Z', end_time: '2023-11-16T23:00:00Z', color_id: 1 }] }, { phenomenon_id: '2', phenomenon_max_color_id: 1, timelaps_items: [{ begin_time: '2023-11-16T05:00:00Z', end_time: '2023-11-16T23:00:00Z', color_id: 1 }] }, { phenomenon_id: '5', phenomenon_max_color_id: 1, timelaps_items: [{ begin_time: '2023-11-16T05:00:00Z', end_time: '2023-11-16T23:00:00Z', color_id: 1 }] }, { phenomenon_id: '7', phenomenon_max_color_id: 1, timelaps_items: [{ begin_time: '2023-11-16T05:00:00Z', end_time: '2023-11-16T23:00:00Z', color_id: 1 }] }, { phenomenon_id: '8', phenomenon_max_color_id: 1, timelaps_items: [{ begin_time: '2023-11-16T05:00:00Z', end_time: '2023-11-16T23:00:00Z', color_id: 1 }] }] }, { domain_id: '0610', max_color_id: 1, phenomenon_items: [{ phenomenon_id: '9', phenomenon_max_color_id: 1, timelaps_items: [{ begin_time: '2023-11-16T05:00:00Z', end_time: '2023-11-16T23:00:00Z', color_id: 1 }] }] }] } }, { echeance: 'J1', begin_validity_time: '2023-11-16T23:00:00Z', end_validity_time: '2023-11-17T23:00:00Z', timelaps: { domain_ids: [{ domain_id: '06', max_color_id: 2, phenomenon_items: [{ phenomenon_id: '1', phenomenon_max_color_id: 2, timelaps_items: [{ begin_time: '2023-11-16T23:00:00Z', end_time: '2023-11-17T15:00:00Z', color_id: 2 }, { begin_time: '2023-11-17T15:00:00Z', end_time: '2023-11-17T23:00:00Z', color_id: 1 }] }, { phenomenon_id: '4', phenomenon_max_color_id: 1, timelaps_items: [] }, { phenomenon_id: '3', phenomenon_max_color_id: 2, timelaps_items: [{ begin_time: '2023-11-16T23:00:00Z', end_time: '2023-11-17T05:00:00Z', color_id: 1 }, { begin_time: '2023-11-17T05:00:00Z', end_time: '2023-11-17T18:00:00Z', color_id: 2 }, { begin_time: '2023-11-17T18:00:00Z', end_time: '2023-11-17T23:00:00Z', color_id: 1 }] }, { phenomenon_id: '2', phenomenon_max_color_id: 1, timelaps_items: [{ begin_time: '2023-11-16T23:00:00Z', end_time: '2023-11-17T23:00:00Z', color_id: 1 }] }, { phenomenon_id: '5', phenomenon_max_color_id: 1, timelaps_items: [{ begin_time: '2023-11-16T23:00:00Z', end_time: '2023-11-17T23:00:00Z', color_id: 1 }] }, { phenomenon_id: '7', phenomenon_max_color_id: 1, timelaps_items: [{ begin_time: '2023-11-16T23:00:00Z', end_time: '2023-11-17T23:00:00Z', color_id: 1 }] }, { phenomenon_id: '8', phenomenon_max_color_id: 1, timelaps_items: [{ begin_time: '2023-11-16T23:00:00Z', end_time: '2023-11-17T23:00:00Z', color_id: 1 }] }] }, { domain_id: '0610', max_color_id: 1, phenomenon_items: [{ phenomenon_id: '9', phenomenon_max_color_id: 1, timelaps_items: [{ begin_time: '2023-11-16T23:00:00Z', end_time: '2023-11-17T23:00:00Z', color_id: 2 }] }] }] } }] } })
      .onGet(baseURL, { params: params5 }).reply(200, { product: { periods: [{ echeance: 'J', begin_validity_time: '2023-11-16T05:00:00Z', end_validity_time: '2023-11-16T23:00:00Z', timelaps: { domain_ids: [{ domain_id: '74', max_color_id: 2, phenomenon_items: [{ phenomenon_id: '1', phenomenon_max_color_id: 2, timelaps_items: [{ begin_time: '2023-11-16T05:00:00Z', end_time: '2023-11-16T17:00:00Z', color_id: 1 }, { begin_time: '2023-11-16T17:00:00Z', end_time: '2023-11-16T23:00:00Z', color_id: 2 }] }, { phenomenon_id: '4', phenomenon_max_color_id: 2, timelaps_items: [] }, { phenomenon_id: '3', phenomenon_max_color_id: 1, timelaps_items: [{ begin_time: '2023-11-16T05:00:00Z', end_time: '2023-11-16T23:00:00Z', color_id: 1 }] }, { phenomenon_id: '2', phenomenon_max_color_id: 1, timelaps_items: [{ begin_time: '2023-11-16T05:00:00Z', end_time: '2023-11-16T23:00:00Z', color_id: 1 }] }, { phenomenon_id: '5', phenomenon_max_color_id: 1, timelaps_items: [{ begin_time: '2023-11-16T05:00:00Z', end_time: '2023-11-16T23:00:00Z', color_id: 1 }] }, { phenomenon_id: '7', phenomenon_max_color_id: 1, timelaps_items: [{ begin_time: '2023-11-16T05:00:00Z', end_time: '2023-11-16T23:00:00Z', color_id: 1 }] }, { phenomenon_id: '8', phenomenon_max_color_id: 1, timelaps_items: [{ begin_time: '2023-11-16T05:00:00Z', end_time: '2023-11-16T23:00:00Z', color_id: 1 }] }] }] } }, { echeance: 'J1', begin_validity_time: '2023-11-16T23:00:00Z', end_validity_time: '2023-11-17T23:00:00Z', timelaps: { domain_ids: [{ domain_id: '74', max_color_id: 2, phenomenon_items: [{ phenomenon_id: '1', phenomenon_max_color_id: 2, timelaps_items: [{ begin_time: '2023-11-16T23:00:00Z', end_time: '2023-11-17T03:00:00Z', color_id: 2 }, { begin_time: '2023-11-17T03:00:00Z', end_time: '2023-11-17T23:00:00Z', color_id: 1 }] }, { phenomenon_id: '4', phenomenon_max_color_id: 1, timelaps_items: [] }, { phenomenon_id: '3', phenomenon_max_color_id: 1, timelaps_items: [{ begin_time: '2023-11-16T23:00:00Z', end_time: '2023-11-17T23:00:00Z', color_id: 1 }] }, { phenomenon_id: '2', phenomenon_max_color_id: 1, timelaps_items: [{ begin_time: '2023-11-16T23:00:00Z', end_time: '2023-11-17T23:00:00Z', color_id: 1 }] }, { phenomenon_id: '5', phenomenon_max_color_id: 1, timelaps_items: [{ begin_time: '2023-11-16T23:00:00Z', end_time: '2023-11-17T23:00:00Z', color_id: 1 }] }, { phenomenon_id: '7', phenomenon_max_color_id: 1, timelaps_items: [{ begin_time: '2023-11-16T23:00:00Z', end_time: '2023-11-17T23:00:00Z', color_id: 1 }] }, { phenomenon_id: '8', phenomenon_max_color_id: 2, timelaps_items: [{ begin_time: '2023-11-16T23:00:00Z', end_time: '2023-11-17T23:00:00Z', color_id: 2 }] }] }] } }] } })
      .onGet(baseURL, { params: params6 }).reply(200, { product: { periods: [{ echeance: 'J1', begin_validity_time: '2023-11-16T23:00:00Z', end_validity_time: '2023-11-17T23:00:00Z', timelaps: { domain_ids: [{ domain_id: '42', max_color_id: 2, phenomenon_items: [{ phenomenon_id: '1', phenomenon_max_color_id: 1, timelaps_items: [{ begin_time: '2023-11-16T23:00:00Z', end_time: '2023-11-17T23:00:00Z', color_id: 1 }] }, { phenomenon_id: '4', phenomenon_max_color_id: 2, timelaps_items: [] }, { phenomenon_id: '3', phenomenon_max_color_id: 1, timelaps_items: [{ begin_time: '2023-11-16T23:00:00Z', end_time: '2023-11-17T23:00:00Z', color_id: 1 }] }, { phenomenon_id: '2', phenomenon_max_color_id: 1, timelaps_items: [{ begin_time: '2023-11-16T23:00:00Z', end_time: '2023-11-17T23:00:00Z', color_id: 1 }] }, { phenomenon_id: '5', phenomenon_max_color_id: 1, timelaps_items: [{ begin_time: '2023-11-16T23:00:00Z', end_time: '2023-11-17T23:00:00Z', color_id: 1 }] }, { phenomenon_id: '7', phenomenon_max_color_id: 1, timelaps_items: [{ begin_time: '2023-11-16T23:00:00Z', end_time: '2023-11-17T23:00:00Z', color_id: 1 }] }] }] } }] } })
      .onGet(baseURL, { params: params7 }).reply(200, { product: { periods: [{ echeance: 'J', begin_validity_time: '2023-11-16T05:00:00Z', end_validity_time: '2023-11-16T23:00:00Z', timelaps: { domain_ids: [{ domain_id: '06', max_color_id: 2, phenomenon_items: [{ phenomenon_id: '4', phenomenon_max_color_id: 1, timelaps_items: [] }] }, { domain_id: '0610', max_color_id: 1, phenomenon_items: [{ phenomenon_id: '9', phenomenon_max_color_id: 1, timelaps_items: [{ begin_time: '2023-11-15T23:00:00Z', end_time: '2023-11-16T05:00:00Z', color_id: 1 }, { begin_time: '2023-11-16T05:00:00Z', end_time: '2023-11-16T18:00:00Z', color_id: 2 }, { begin_time: '2023-11-16T18:00:00Z', end_time: '2023-11-16T23:00:00Z', color_id: 1 }] }] }] } }, { echeance: 'J1', begin_validity_time: '2023-11-16T23:00:00Z', end_validity_time: '2023-11-17T23:00:00Z', timelaps: { domain_ids: [{ domain_id: '06', max_color_id: 2, phenomenon_items: [{ phenomenon_id: '4', phenomenon_max_color_id: 1, timelaps_items: [] }] }, { domain_id: '0610', max_color_id: 1, phenomenon_items: [{ phenomenon_id: '9', phenomenon_max_color_id: 1, timelaps_items: [{ begin_time: '2023-11-16T23:00:00Z', end_time: '2023-11-17T23:00:00Z', color_id: 1 }] }] }] } }] } })
      .onGet(baseURL, { params: params8 }).reply(200, { product: { periods: [{ echeance: 'J', begin_validity_time: '2023-11-16T05:00:00Z', end_validity_time: '2023-11-16T23:00:00Z', timelaps: { domain_ids: [{ domain_id: '06', max_color_id: 2, phenomenon_items: [{ phenomenon_id: '4', phenomenon_max_color_id: 1, timelaps_items: [] }] }, { domain_id: '0610', max_color_id: 1, phenomenon_items: [{ phenomenon_id: '9', phenomenon_max_color_id: 1, timelaps_items: [{ begin_time: '2023-11-15T23:00:00Z', end_time: '2023-11-16T23:00:00Z', color_id: 1 }] }] }] } }, { echeance: 'J1', begin_validity_time: '2023-11-16T23:00:00Z', end_validity_time: '2023-11-17T23:00:00Z', timelaps: { domain_ids: [{ domain_id: '06', max_color_id: 2, phenomenon_items: [{ phenomenon_id: '4', phenomenon_max_color_id: 1, timelaps_items: [] }] }, { domain_id: '0610', max_color_id: 1, phenomenon_items: [{ phenomenon_id: '9', phenomenon_max_color_id: 1, timelaps_items: [{ begin_time: '2023-11-16T23:00:00Z', end_time: '2023-11-17T05:00:00Z', color_id: 1 }, { begin_time: '2023-11-17T05:00:00Z', end_time: '2023-11-17T18:00:00Z', color_id: 2 }, { begin_time: '2023-11-17T18:00:00Z', end_time: '2023-11-17T23:00:00Z', color_id: 1 }] }] }] } }] } })
      .onGet(baseURL, { params: params9 }).reply(200, { product: { periods: [{ echeance: 'J', begin_validity_time: '2023-11-16T05:00:00Z', end_validity_time: '2023-11-16T23:00:00Z', timelaps: { domain_ids: [{ domain_id: '06', max_color_id: 2, phenomenon_items: [{ phenomenon_id: '4', phenomenon_max_color_id: 1, timelaps_items: [] }] }, { domain_id: '0610', max_color_id: 1, phenomenon_items: [{ phenomenon_id: '9', phenomenon_max_color_id: 1, timelaps_items: [{ begin_time: '2023-11-15T23:00:00Z', end_time: '2023-11-16T23:00:00Z', color_id: 1 }] }] }] } }, { echeance: 'J1', begin_validity_time: '2023-11-16T23:00:00Z', end_validity_time: '2023-11-17T23:00:00Z', timelaps: { domain_ids: [{ domain_id: '06', max_color_id: 2, phenomenon_items: [{ phenomenon_id: '4', phenomenon_max_color_id: 1, timelaps_items: [] }] }, { domain_id: '0610', max_color_id: 1, phenomenon_items: [{ phenomenon_id: '9', phenomenon_max_color_id: 1, timelaps_items: [{ begin_time: '2023-11-16T23:00:00Z', end_time: '2023-11-17T05:00:00Z', color_id: 2 }, { begin_time: '2023-11-17T05:00:00Z', end_time: '2023-11-17T18:00:00Z', color_id: 3 }, { begin_time: '2023-11-17T18:00:00Z', end_time: '2023-11-17T23:00:00Z', color_id: 2 }] }] }] } }] } })
      .onGet(baseURL, { params: param10 }).reply(200, { product: { periods: [{ echeance: 'J', begin_validity_time: '2023-11-16T05:00:00Z', end_validity_time: '2023-11-16T23:00:00Z', timelaps: { domain_ids: [{ domain_id: '74', max_color_id: 2, phenomenon_items: [{ phenomenon_id: '1', phenomenon_max_color_id: 2, timelaps_items: [{ begin_time: '2023-11-16T05:00:00Z', end_time: '2023-11-16T21:00:00Z', color_id: 1 }, { begin_time: '2023-11-16T21:00:00Z', end_time: '2023-11-16T23:00:00Z', color_id: 2 }] }, { phenomenon_id: '5', phenomenon_max_color_id: 2, timelaps_items: [{ begin_time: '2023-11-16T05:00:00Z', end_time: '2023-11-16T21:00:00Z', color_id: 1 }, { begin_time: '2023-11-16T21:00:00Z', end_time: '2023-11-16T23:00:00Z', color_id: 2 }] }, { phenomenon_id: '6', phenomenon_max_color_id: 1, timelaps_items: [{ begin_time: '2023-11-16T05:00:00Z', end_time: '2023-11-16T23:00:00Z', color_id: 1 }] }] }] } }, { echeance: 'J1', begin_validity_time: '2023-11-16T23:00:00Z', end_validity_time: '2023-11-17T23:00:00Z', timelaps: { domain_ids: [{ domain_id: '74', max_color_id: 2, phenomenon_items: [{ phenomenon_id: '1', phenomenon_max_color_id: 1, timelaps_items: [{ begin_time: '2023-11-16T23:00:00Z', end_time: '2023-11-17T23:00:00Z', color_id: 1 }] }, { phenomenon_id: '5', phenomenon_max_color_id: 1, timelaps_items: [{ begin_time: '2023-11-16T23:00:00Z', end_time: '2023-11-17T23:00:00Z', color_id: 2 }] }, { phenomenon_id: '6', phenomenon_max_color_id: 2, timelaps_items: [{ begin_time: '2023-11-16T23:00:00Z', end_time: '2023-11-17T07:00:00Z', color_id: 2 }, { begin_time: '2023-11-17T07:00:00Z', end_time: '2023-11-17T23:00:00Z', color_id: 2 }] }] }] } }] } })
      .onGet(baseURL, { params: param11 }).reply(200, { product: { periods: [{ echeance: 'J', begin_validity_time: '2023-11-16T05:00:00Z', end_validity_time: '2023-11-16T23:00:00Z', timelaps: { domain_ids: [{ domain_id: '06', max_color_id: 2, phenomenon_items: [{ phenomenon_id: '8', phenomenon_max_color_id: 1, timelaps_items: [{ begin_time: '2023-11-16T05:00:00Z', end_time: '2023-11-16T23:00:00Z', color_id: 1 }] }] }, { domain_id: '13', max_color_id: 2, phenomenon_items: [{ phenomenon_id: '8', phenomenon_max_color_id: 1, timelaps_items: [{ begin_time: '2023-11-16T05:00:00Z', end_time: '2023-11-16T23:00:00Z', color_id: 1 }] }] }, { domain_id: '0610', max_color_id: 1, phenomenon_items: [{ phenomenon_id: '9', phenomenon_max_color_id: 2, timelaps_items: [{ begin_time: '2023-11-16T00:00:00Z', end_time: '2023-11-16T14:00:00Z', color_id: 1 }, { begin_time: '2023-11-16T14:00:00Z', end_time: '2023-11-16T23:00:00Z', color_id: 2 }] }] }, { domain_id: '1310', max_color_id: 1, phenomenon_items: [{ phenomenon_id: '9', phenomenon_max_color_id: 2, timelaps_items: [{ begin_time: '2023-11-16T00:00:00Z', end_time: '2023-11-16T14:00:00Z', color_id: 1 }, { begin_time: '2023-11-16T14:00:00Z', end_time: '2023-11-16T23:00:00Z', color_id: 2 }] }] }] } }, { echeance: 'J1', begin_validity_time: '2023-11-16T23:00:00Z', end_validity_time: '2023-11-17T23:00:00Z', timelaps: { domain_ids: [{ domain_id: '06', max_color_id: 1, phenomenon_items: [{ phenomenon_id: '8', phenomenon_max_color_id: 1, timelaps_items: [{ begin_time: '2023-11-16T23:00:00Z', end_time: '2023-11-17T23:00:00Z', color_id: 1 }] }] }, { domain_id: '13', max_color_id: 1, phenomenon_items: [{ phenomenon_id: '8', phenomenon_max_color_id: 1, timelaps_items: [{ begin_time: '2023-11-16T23:00:00Z', end_time: '2023-11-17T23:00:00Z', color_id: 1 }] }] }, { domain_id: '0610', max_color_id: 1, phenomenon_items: [{ phenomenon_id: '9', phenomenon_max_color_id: 1, timelaps_items: [{ begin_time: '2023-11-16T23:00:00Z', end_time: '2023-11-17T23:00:00Z', color_id: 2 }] }] }, { domain_id: '1310', max_color_id: 1, phenomenon_items: [{ phenomenon_id: '9', phenomenon_max_color_id: 1, timelaps_items: [{ begin_time: '2023-11-16T23:00:00Z', end_time: '2023-11-17T23:00:00Z', color_id: 1 }] }] }] } }] } })
      .onGet(baseURL, { params: param12 }).reply(200, { product: { periods: [{ echeance: 'J', begin_validity_time: '2023-11-16T05:00:00Z', end_validity_time: '2023-11-16T23:00:00Z', timelaps: { domain_ids: [{ domain_id: '06', max_color_id: 2, phenomenon_items: [{ phenomenon_id: '8', phenomenon_max_color_id: 1, timelaps_items: [{ begin_time: '2023-11-16T05:00:00Z', end_time: '2023-11-16T23:00:00Z', color_id: 1 }] }] }, { domain_id: '13', max_color_id: 2, phenomenon_items: [{ phenomenon_id: '8', phenomenon_max_color_id: 1, timelaps_items: [{ begin_time: '2023-11-16T05:00:00Z', end_time: '2023-11-16T23:00:00Z', color_id: 1 }] }] }, { domain_id: '0610', max_color_id: 1, phenomenon_items: [{ phenomenon_id: '9', phenomenon_max_color_id: 2, timelaps_items: [{ begin_time: '2023-11-16T00:00:00Z', end_time: '2023-11-16T07:00:00Z', color_id: 2 }, { begin_time: '2023-11-16T07:00:00Z', end_time: '2023-11-16T14:00:00Z', color_id: 1 }, { begin_time: '2023-11-16T14:00:00Z', end_time: '2023-11-16T23:00:00Z', color_id: 2 }] }] }, { domain_id: '1310', max_color_id: 1, phenomenon_items: [{ phenomenon_id: '9', phenomenon_max_color_id: 2, timelaps_items: [{ begin_time: '2023-11-16T00:00:00Z', end_time: '2023-11-16T23:00:00Z', color_id: 2 }] }] }] } }, { echeance: 'J1', begin_validity_time: '2023-11-16T23:00:00Z', end_validity_time: '2023-11-17T23:00:00Z', timelaps: { domain_ids: [{ domain_id: '06', max_color_id: 1, phenomenon_items: [{ phenomenon_id: '8', phenomenon_max_color_id: 1, timelaps_items: [{ begin_time: '2023-11-16T23:00:00Z', end_time: '2023-11-17T23:00:00Z', color_id: 1 }] }] }, { domain_id: '13', max_color_id: 1, phenomenon_items: [{ phenomenon_id: '8', phenomenon_max_color_id: 1, timelaps_items: [{ begin_time: '2023-11-16T23:00:00Z', end_time: '2023-11-17T23:00:00Z', color_id: 1 }] }] }, { domain_id: '0610', max_color_id: 1, phenomenon_items: [{ phenomenon_id: '9', phenomenon_max_color_id: 1, timelaps_items: [{ begin_time: '2023-11-16T23:00:00Z', end_time: '2023-11-17T14:00:00Z', color_id: 2 }, { begin_time: '2023-11-16T14:00:00Z', end_time: '2023-11-16T18:00:00Z', color_id: 1 }, { begin_time: '2023-11-16T18:00:00Z', end_time: '2023-11-17T23:00:00Z', color_id: 2 }] }] }, { domain_id: '1310', max_color_id: 1, phenomenon_items: [{ phenomenon_id: '9', phenomenon_max_color_id: 1, timelaps_items: [{ begin_time: '2023-11-16T23:00:00Z', end_time: '2023-11-17T23:00:00Z', color_id: 2 }] }] }] } }] } })
      .onGet(baseURL, { params: param13 }).reply(200, { product: { periods: [{ echeance: 'J', begin_validity_time: '2023-11-16T05:00:00Z', end_validity_time: '2023-11-16T23:00:00Z', timelaps: { domain_ids: [{ domain_id: '06', max_color_id: 2, phenomenon_items: [{ phenomenon_id: '8', phenomenon_max_color_id: 1, timelaps_items: [{ begin_time: '2023-11-16T05:00:00Z', end_time: '2023-11-16T23:00:00Z', color_id: 1 }] }] }, { domain_id: '13', max_color_id: 2, phenomenon_items: [{ phenomenon_id: '8', phenomenon_max_color_id: 1, timelaps_items: [{ begin_time: '2023-11-16T05:00:00Z', end_time: '2023-11-16T23:00:00Z', color_id: 1 }] }] }, { domain_id: '0610', max_color_id: 1, phenomenon_items: [{ phenomenon_id: '9', phenomenon_max_color_id: 2, timelaps_items: [{ begin_time: '2023-11-16T00:00:00Z', end_time: '2023-11-16T07:00:00Z', color_id: 2 }, { begin_time: '2023-11-16T07:00:00Z', end_time: '2023-11-16T23:00:00Z', color_id: 1 }] }] }, { domain_id: '1310', max_color_id: 1, phenomenon_items: [{ phenomenon_id: '9', phenomenon_max_color_id: 2, timelaps_items: [{ begin_time: '2023-11-16T00:00:00Z', end_time: '2023-11-16T23:00:00Z', color_id: 2 }] }] }] } }, { echeance: 'J1', begin_validity_time: '2023-11-16T23:00:00Z', end_validity_time: '2023-11-17T23:00:00Z', timelaps: { domain_ids: [{ domain_id: '06', max_color_id: 1, phenomenon_items: [{ phenomenon_id: '8', phenomenon_max_color_id: 1, timelaps_items: [{ begin_time: '2023-11-16T23:00:00Z', end_time: '2023-11-17T23:00:00Z', color_id: 1 }] }] }, { domain_id: '13', max_color_id: 1, phenomenon_items: [{ phenomenon_id: '8', phenomenon_max_color_id: 1, timelaps_items: [{ begin_time: '2023-11-16T23:00:00Z', end_time: '2023-11-17T23:00:00Z', color_id: 1 }] }] }, { domain_id: '0610', max_color_id: 1, phenomenon_items: [{ phenomenon_id: '9', phenomenon_max_color_id: 1, timelaps_items: [{ begin_time: '2023-11-16T23:00:00Z', end_time: '2023-11-17T14:00:00Z', color_id: 1 }, { begin_time: '2023-11-16T14:00:00Z', end_time: '2023-11-17T23:00:00Z', color_id: 2 }] }] }, { domain_id: '1310', max_color_id: 1, phenomenon_items: [{ phenomenon_id: '9', phenomenon_max_color_id: 1, timelaps_items: [{ begin_time: '2023-11-16T23:00:00Z', end_time: '2023-11-17T23:00:00Z', color_id: 2 }] }] }] } }] } })
      .onAny().reply(404)
  })
  afterAll(() => {
    mock.reset()
    jest.useRealTimers()
  })
  beforeEach(() => {
    client = new InfoVille()
  })

  test('should return warn no data with response empty', async () => {
    const spy1 = jest.spyOn(logger, 'warn')
    await client.getMeteoVigilance('07', 'vigimet', 'nodata1')
    expect(spy1).toHaveBeenCalledWith('Pas de réponse de meteofrance')
  })
  test('should return warn no data with response empty', async () => {
    const spy1 = jest.spyOn(logger, 'warn')
    await client.getMeteoVigilance('07', 'vigimet', 'nodata2')
    expect(spy1).toHaveBeenCalledWith('Pas de données de vigilance')
  })
  test('should return correct data with no additional 1', async () => {
    const res = { vigiCrue: 'Jaune', vigiCrue1: '', vigiCrue1D: '', vigiCrue1F: '', vigiCrueD: 1700110800, vigiCrueF: 1700262000, vigiFroid: 'Vert', vigiFroid1: '', vigiFroid1D: '', vigiFroid1F: '', vigiFroid2: '', vigiFroid2D: '', vigiFroid2F: '', vigiFroidD: 1700110800, vigiFroidF: 1700262000, vigiNeige: 'Vert', vigiNeige1: '', vigiNeige1D: '', vigiNeige1F: '', vigiNeige2: '', vigiNeige2D: '', vigiNeige2F: '', vigiNeigeD: 1700110800, vigiNeigeF: 1700262000, vigiOrage: 'Vert', vigiOrage1: 'Jaune', vigiOrage1D: 1700143200, vigiOrage1F: 1700240400, vigiOrage2: 'Vert', vigiOrage2D: 1700154000, vigiOrage2F: 1700262000, vigiOrageD: 1700110800, vigiOrageF: 1700229600, vigiPluie: 'Vert', vigiPluie1: '', vigiPluie1D: '', vigiPluie1F: '', vigiPluie2: '', vigiPluie2D: '', vigiPluie2F: '', vigiPluieD: 1700110800, vigiPluieF: 1700262000, vigiVent: 'Vert', vigiVent1: 'Jaune', vigiVent1D: 1700128800, vigiVent1F: 1700172000, vigiVent2: 'Vert', vigiVent2D: 1700172000, vigiVent2F: 1700218800, vigiVentD: 1700110800, vigiVentF: 1700128800 }
    const spy1 = jest.spyOn(logger, 'warn')
    const spy2 = jest.spyOn(eventEmitter, 'emit').mockImplementation(() => {})
    jest.useFakeTimers({ now: new Date(2023, 10, 16, 7, 5) })
    await client.getMeteoVigilance('42', 'vigimet', 'testretour1')
    expect(spy1).not.toHaveBeenCalled()
    expect(spy2).toHaveBeenCalledWith('frame', 'vigimet/vigilance', res)
  })
  test('should return correct data with no additional 2', async () => {
    const res = { vigiCrue: 'Jaune', vigiCrue1: '', vigiCrue1D: '', vigiCrue1F: '', vigiCrueD: 1700110800, vigiCrueF: 1700262000, vigiFroid: 'Vert', vigiFroid1: '', vigiFroid1D: '', vigiFroid1F: '', vigiFroid2: '', vigiFroid2D: '', vigiFroid2F: '', vigiFroidD: 1700110800, vigiFroidF: 1700262000, vigiNeige: 'Vert', vigiNeige1: '', vigiNeige1D: '', vigiNeige1F: '', vigiNeige2: '', vigiNeige2D: '', vigiNeige2F: '', vigiNeigeD: 1700110800, vigiNeigeF: 1700262000, vigiOrage: 'Vert', vigiOrage1: 'Jaune', vigiOrage1D: 1700143200, vigiOrage1F: 1700240400, vigiOrage2: 'Vert', vigiOrage2D: 1700154000, vigiOrage2F: 1700262000, vigiOrageD: 1700110800, vigiOrageF: 1700229600, vigiPluie: 'Vert', vigiPluie1: '', vigiPluie1D: '', vigiPluie1F: '', vigiPluie2: '', vigiPluie2D: '', vigiPluie2F: '', vigiPluieD: 1700110800, vigiPluieF: 1700262000, vigiVent: 'Jaune', vigiVent1: 'Vert', vigiVent1D: 1700172000, vigiVent1F: 1700218800, vigiVent2: 'Jaune', vigiVent2D: 1700218800, vigiVent2F: 1700244000, vigiVentD: 1700128800, vigiVentF: 1700172000 }
    const spy1 = jest.spyOn(logger, 'warn')
    const spy2 = jest.spyOn(eventEmitter, 'emit').mockImplementation(() => {})
    jest.useFakeTimers({ now: new Date(2023, 10, 16, 12, 5) })
    await client.getMeteoVigilance('42', 'vigimet', 'testretour1')
    expect(spy1).not.toHaveBeenCalled()
    expect(spy2).toHaveBeenCalledWith('frame', 'vigimet/vigilance', res)
  })
  test('should return correct data with no additional 3', async () => {
    const res = { vigiCrue: 'Jaune', vigiCrue1: '', vigiCrue1D: '', vigiCrue1F: '', vigiCrueD: 1700110800, vigiCrueF: 1700262000, vigiFroid: 'Vert', vigiFroid1: '', vigiFroid1D: '', vigiFroid1F: '', vigiFroid2: '', vigiFroid2D: '', vigiFroid2F: '', vigiFroidD: 1700175600, vigiFroidF: 1700262000, vigiNeige: 'Vert', vigiNeige1: '', vigiNeige1D: '', vigiNeige1F: '', vigiNeige2: '', vigiNeige2D: '', vigiNeige2F: '', vigiNeigeD: 1700175600, vigiNeigeF: 1700262000, vigiOrage: 'Vert', vigiOrage1: 'Jaune', vigiOrage1D: 1700143200, vigiOrage1F: 1700240400, vigiOrage2: 'Vert', vigiOrage2D: 1700154000, vigiOrage2F: 1700262000, vigiOrageD: 1700175600, vigiOrageF: 1700229600, vigiPluie: 'Vert', vigiPluie1: '', vigiPluie1D: '', vigiPluie1F: '', vigiPluie2: '', vigiPluie2D: '', vigiPluie2F: '', vigiPluieD: 1700175600, vigiPluieF: 1700262000, vigiVent: 'Vert', vigiVent1: 'Jaune', vigiVent1D: 1700218800, vigiVent1F: 1700244000, vigiVent2: 'Vert', vigiVent2D: 1700244000, vigiVent2F: 1700262000, vigiVentD: 1700175600, vigiVentF: 1700218800 }
    const spy1 = jest.spyOn(logger, 'warn')
    const spy2 = jest.spyOn(eventEmitter, 'emit').mockImplementation(() => {})
    jest.useFakeTimers({ now: new Date(2023, 10, 17, 0, 5) })
    await client.getMeteoVigilance('42', 'vigimet', 'testretour1')
    expect(spy1).not.toHaveBeenCalled()
    expect(spy2).toHaveBeenCalledWith('frame', 'vigimet/vigilance', res)
  })
  test('should return correct data with no additional 4', async () => {
    const res = { vigiCanicule: 'Vert', vigiCanicule1: 'Jaune', vigiCanicule1D: 1700175600, vigiCanicule1F: 1700204400, vigiCanicule2: 'Jaune', vigiCanicule2D: 1700204400, vigiCanicule2F: 1700262000, vigiCaniculeD: 1700110800, vigiCaniculeF: 1700175600, vigiNeige: 'Vert', vigiNeige1: 'Jaune', vigiNeige1D: 1700168400, vigiNeige1F: 1700262000, vigiNeige2: '', vigiNeige2D: '', vigiNeige2F: '', vigiNeigeD: 1700110800, vigiNeigeF: 1700168400, vigiVent: 'Vert', vigiVent1: 'Jaune', vigiVent1D: 1700168400, vigiVent1F: 1700175600, vigiVent2: 'Vert', vigiVent2D: 1700175600, vigiVent2F: 1700262000, vigiVentD: 1700110800, vigiVentF: 1700168400 }
    const spy1 = jest.spyOn(logger, 'warn')
    const spy2 = jest.spyOn(eventEmitter, 'emit').mockImplementation(() => {})
    jest.useFakeTimers({ now: new Date(2023, 10, 16, 1, 5) })
    await client.getMeteoVigilance('74', 'vigimet', 'testretour4')
    expect(spy1).not.toHaveBeenCalled()
    expect(spy2).toHaveBeenCalledWith('frame', 'vigimet/vigilance', res)
  })
  test('should return correct data with additional', async () => {
    const res = { vigiAvalanche: 'Vert', vigiAvalanche1: '', vigiAvalanche1D: '', vigiAvalanche1F: '', vigiAvalanche2: '', vigiAvalanche2D: '', vigiAvalanche2F: '', vigiAvalancheD: 1700110800, vigiAvalancheF: 1700262000, vigiCrue: 'Vert', vigiCrue1: '', vigiCrue1D: '', vigiCrue1F: '', vigiCrueD: 1700110800, vigiCrueF: 1700262000, vigiFroid: 'Vert', vigiFroid1: '', vigiFroid1D: '', vigiFroid1F: '', vigiFroid2: '', vigiFroid2D: '', vigiFroid2F: '', vigiFroidD: 1700110800, vigiFroidF: 1700262000, vigiNeige: 'Vert', vigiNeige1: '', vigiNeige1D: '', vigiNeige1F: '', vigiNeige2: '', vigiNeige2D: '', vigiNeige2F: '', vigiNeigeD: 1700110800, vigiNeigeF: 1700262000, vigiOrage: 'Vert', vigiOrage1: 'Jaune', vigiOrage1D: 1700197200, vigiOrage1F: 1700244000, vigiOrage2: 'Vert', vigiOrage2D: 1700244000, vigiOrage2F: 1700262000, vigiOrageD: 1700110800, vigiOrageF: 1700197200, vigiPluie: 'Vert', vigiPluie1: '', vigiPluie1D: '', vigiPluie1F: '', vigiPluie2: '', vigiPluie2D: '', vigiPluie2F: '', vigiPluieD: 1700110800, vigiPluieF: 1700262000, vigiVague: 'Vert', vigiVague1: 'Jaune', vigiVague1D: 1700175600, vigiVague1F: 1700262000, vigiVague2: '', vigiVague2D: '', vigiVague2F: '', vigiVagueD: 1700110800, vigiVagueF: 1700175600, vigiVent: 'Jaune', vigiVent1: 'Vert', vigiVent1D: 1700233200, vigiVent1F: 1700262000, vigiVent2: '', vigiVent2D: '', vigiVent2F: '', vigiVentD: 1700164800, vigiVentF: 1700233200 }
    const spy1 = jest.spyOn(logger, 'warn')
    const spy2 = jest.spyOn(eventEmitter, 'emit').mockImplementation(() => {})
    jest.useFakeTimers({ now: new Date(2023, 10, 16, 21, 5) })
    await client.getMeteoVigilance('06', 'vigimet', 'testretour2')
    expect(spy1).not.toHaveBeenCalled()
    expect(spy2).toHaveBeenCalledWith('frame', 'vigimet/vigilance', res)
  })
  test('should return correct data with vagues 1', async () => {
    const res = { vigiCrue: 'Vert', vigiCrue1: '', vigiCrue1D: '', vigiCrue1F: '', vigiCrueD: 1700110800, vigiCrueF: 1700262000, vigiVague: 'Jaune', vigiVague1: 'Vert', vigiVague1D: 1700157600, vigiVague1F: 1700262000, vigiVague2: '', vigiVague2D: '', vigiVague2F: '', vigiVagueD: 1700110800, vigiVagueF: 1700157600 }
    const spy1 = jest.spyOn(logger, 'warn')
    const spy2 = jest.spyOn(eventEmitter, 'emit').mockImplementation(() => {})
    jest.useFakeTimers({ now: new Date(2023, 10, 16, 7, 5) })
    await client.getMeteoVigilance('06', 'vigimet', 'multivagues1')
    expect(spy1).not.toHaveBeenCalled()
    expect(spy2).toHaveBeenCalledWith('frame', 'vigimet/vigilance', res)
  })
  test('should return correct data with vague 2', async () => {
    const res = { vigiCrue: 'Vert', vigiCrue1: '', vigiCrue1D: '', vigiCrue1F: '', vigiCrueD: 1700110800, vigiCrueF: 1700262000, vigiVague: 'Vert', vigiVague1: 'Jaune', vigiVague1D: 1700197200, vigiVague1F: 1700244000, vigiVague2: 'Vert', vigiVague2D: 1700244000, vigiVague2F: 1700262000, vigiVagueD: 1700089200, vigiVagueF: 1700197200 }
    const spy1 = jest.spyOn(logger, 'warn')
    const spy2 = jest.spyOn(eventEmitter, 'emit').mockImplementation(() => {})
    jest.useFakeTimers({ now: new Date(2023, 10, 16, 7, 5) })
    await client.getMeteoVigilance('06', 'vigimet', 'multivagues2')
    expect(spy1).not.toHaveBeenCalled()
    expect(spy2).toHaveBeenCalledWith('frame', 'vigimet/vigilance', res)
  })
  test('should return correct data with vague 3', async () => {
    const res = { vigiCrue: 'Vert', vigiCrue1: '', vigiCrue1D: '', vigiCrue1F: '', vigiCrueD: 1700110800, vigiCrueF: 1700262000, vigiVague: 'Vert', vigiVague1: 'Jaune', vigiVague1D: 1700175600, vigiVague1F: 1700197200, vigiVague2: 'Orange', vigiVague2D: 1700197200, vigiVague2F: 1700244000, vigiVagueD: 1700089200, vigiVagueF: 1700175600 }
    const spy1 = jest.spyOn(logger, 'warn')
    const spy2 = jest.spyOn(eventEmitter, 'emit').mockImplementation(() => {})
    jest.useFakeTimers({ now: new Date(2023, 10, 16, 7, 5) })
    await client.getMeteoVigilance('06', 'vigimet', 'multivagues3')
    expect(spy1).not.toHaveBeenCalled()
    expect(spy2).toHaveBeenCalledWith('frame', 'vigimet/vigilance', res)
  })
  test('should return correct data with vague 4 dpt06', async () => {
    const res = { vigiAvalanche: 'Vert', vigiAvalanche1: '', vigiAvalanche1D: '', vigiAvalanche1F: '', vigiAvalanche2: '', vigiAvalanche2D: '', vigiAvalanche2F: '', vigiAvalancheD: 1700110800, vigiAvalancheF: 1700262000, vigiVague: 'Vert', vigiVague1: 'Jaune', vigiVague1D: 1700143200, vigiVague1F: 1700262000, vigiVague2: '', vigiVague2D: '', vigiVague2F: '', vigiVagueD: 1700092800, vigiVagueF: 1700143200 }
    const spy1 = jest.spyOn(logger, 'warn')
    const spy2 = jest.spyOn(eventEmitter, 'emit').mockImplementation(() => {})
    jest.useFakeTimers({ now: new Date(2023, 10, 16, 1, 5) })
    await client.getMeteoVigilance('06', 'vigimet', 'testvague4')
    expect(spy1).not.toHaveBeenCalled()
    expect(spy2).toHaveBeenCalledWith('frame', 'vigimet/vigilance', res)
  })
  test('should return correct data with vague 4 dpt13', async () => {
    const res = { vigiAvalanche: 'Vert', vigiAvalanche1: '', vigiAvalanche1D: '', vigiAvalanche1F: '', vigiAvalanche2: '', vigiAvalanche2D: '', vigiAvalanche2F: '', vigiAvalancheD: 1700110800, vigiAvalancheF: 1700262000, vigiVague: 'Vert', vigiVague1: 'Jaune', vigiVague1D: 1700143200, vigiVague1F: 1700175600, vigiVague2: 'Vert', vigiVague2D: 1700175600, vigiVague2F: 1700262000, vigiVagueD: 1700092800, vigiVagueF: 1700143200 }
    const spy1 = jest.spyOn(logger, 'warn')
    const spy2 = jest.spyOn(eventEmitter, 'emit').mockImplementation(() => {})
    jest.useFakeTimers({ now: new Date(2023, 10, 16, 1, 5) })
    await client.getMeteoVigilance('13', 'vigimet', 'testvague4')
    expect(spy1).not.toHaveBeenCalled()
    expect(spy2).toHaveBeenCalledWith('frame', 'vigimet/vigilance', res)
  })
  test('should return correct data with vague 5 dpt06 1', async () => {
    const res = { vigiAvalanche: 'Vert', vigiAvalanche1: '', vigiAvalanche1D: '', vigiAvalanche1F: '', vigiAvalanche2: '', vigiAvalanche2D: '', vigiAvalanche2F: '', vigiAvalancheD: 1700110800, vigiAvalancheF: 1700262000, vigiVague: 'Jaune', vigiVague1: 'Vert', vigiVague1D: 1700118000, vigiVague1F: 1700143200, vigiVague2: 'Jaune', vigiVague2D: 1700143200, vigiVague2F: 1700229600, vigiVagueD: 1700092800, vigiVagueF: 1700118000 }
    const spy1 = jest.spyOn(logger, 'warn')
    const spy2 = jest.spyOn(eventEmitter, 'emit').mockImplementation(() => {})
    jest.useFakeTimers({ now: new Date(2023, 10, 16, 1, 5) })
    await client.getMeteoVigilance('06', 'vigimet', 'testvague5')
    expect(spy1).not.toHaveBeenCalled()
    expect(spy2).toHaveBeenCalledWith('frame', 'vigimet/vigilance', res)
  })
  test('should return correct data with vague 5 dpt06 2', async () => {
    const res = { vigiAvalanche: 'Vert', vigiAvalanche1: '', vigiAvalanche1D: '', vigiAvalanche1F: '', vigiAvalanche2: '', vigiAvalanche2D: '', vigiAvalanche2F: '', vigiAvalancheD: 1700175600, vigiAvalancheF: 1700262000, vigiVague: 'Jaune', vigiVague1: 'Vert', vigiVague1D: 1700143200, vigiVague1F: 1700157600, vigiVague2: 'Jaune', vigiVague2D: 1700157600, vigiVague2F: 1700262000, vigiVagueD: 1700175600, vigiVagueF: 1700229600 }
    const spy1 = jest.spyOn(logger, 'warn')
    const spy2 = jest.spyOn(eventEmitter, 'emit').mockImplementation(() => {})
    jest.useFakeTimers({ now: new Date(2023, 10, 17, 0, 5) })
    await client.getMeteoVigilance('06', 'vigimet', 'testvague5')
    expect(spy1).not.toHaveBeenCalled()
    expect(spy2).toHaveBeenCalledWith('frame', 'vigimet/vigilance', res)
  })
  test('should return correct data with vague 5 dpt13', async () => {
    const res = { vigiAvalanche: 'Vert', vigiAvalanche1: '', vigiAvalanche1D: '', vigiAvalanche1F: '', vigiAvalanche2: '', vigiAvalanche2D: '', vigiAvalanche2F: '', vigiAvalancheD: 1700110800, vigiAvalancheF: 1700262000, vigiVague: 'Jaune', vigiVague1: '', vigiVague1D: '', vigiVague1F: '', vigiVague2: '', vigiVague2D: '', vigiVague2F: '', vigiVagueD: 1700092800, vigiVagueF: 1700262000 }
    const spy1 = jest.spyOn(logger, 'warn')
    const spy2 = jest.spyOn(eventEmitter, 'emit').mockImplementation(() => {})
    jest.useFakeTimers({ now: new Date(2023, 10, 16, 1, 5) })
    await client.getMeteoVigilance('13', 'vigimet', 'testvague5')
    expect(spy1).not.toHaveBeenCalled()
    expect(spy2).toHaveBeenCalledWith('frame', 'vigimet/vigilance', res)
  })
  test('should return correct data with vague 6 dpt06', async () => {
    const res = { vigiAvalanche: 'Vert', vigiAvalanche1: '', vigiAvalanche1D: '', vigiAvalanche1F: '', vigiAvalanche2: '', vigiAvalanche2D: '', vigiAvalanche2F: '', vigiAvalancheD: 1700110800, vigiAvalancheF: 1700262000, vigiVague: 'Jaune', vigiVague1: 'Vert', vigiVague1D: 1700118000, vigiVague1F: 1700229600, vigiVague2: 'Jaune', vigiVague2D: 1700143200, vigiVague2F: 1700262000, vigiVagueD: 1700092800, vigiVagueF: 1700118000 }
    const spy1 = jest.spyOn(logger, 'warn')
    const spy2 = jest.spyOn(eventEmitter, 'emit').mockImplementation(() => {})
    jest.useFakeTimers({ now: new Date(2023, 10, 16, 1, 5) })
    await client.getMeteoVigilance('06', 'vigimet', 'testvague6')
    expect(spy1).not.toHaveBeenCalled()
    expect(spy2).toHaveBeenCalledWith('frame', 'vigimet/vigilance', res)
  })
  test('should return correct data with vague 6 dpt13', async () => {
    const res = { vigiAvalanche: 'Vert', vigiAvalanche1: '', vigiAvalanche1D: '', vigiAvalanche1F: '', vigiAvalanche2: '', vigiAvalanche2D: '', vigiAvalanche2F: '', vigiAvalancheD: 1700175600, vigiAvalancheF: 1700262000, vigiVague: 'Jaune', vigiVague1: '', vigiVague1D: '', vigiVague1F: '', vigiVague2: '', vigiVague2D: '', vigiVague2F: '', vigiVagueD: 1700175600, vigiVagueF: 1700262000 }
    const spy1 = jest.spyOn(logger, 'warn')
    const spy2 = jest.spyOn(eventEmitter, 'emit').mockImplementation(() => {})
    jest.useFakeTimers({ now: new Date(2023, 10, 17, 0, 15) })
    await client.getMeteoVigilance('13', 'vigimet', 'testvague6')
    expect(spy1).not.toHaveBeenCalled()
    expect(spy2).toHaveBeenCalledWith('frame', 'vigimet/vigilance', res)
  })
  test('should return correct data with mountain additional', async () => {
    const res = { vigiAvalanche: 'Vert', vigiAvalanche1: 'Jaune', vigiAvalanche1D: 1700175600, vigiAvalanche1F: 1700262000, vigiAvalanche2: '', vigiAvalanche2D: '', vigiAvalanche2F: '', vigiAvalancheD: 1700110800, vigiAvalancheF: 1700175600, vigiCrue: 'Jaune', vigiCrue1: 'Vert', vigiCrue1D: 1700175600, vigiCrue1F: 1700262000, vigiCrueD: 1700110800, vigiCrueF: 1700175600, vigiFroid: 'Vert', vigiFroid1: '', vigiFroid1D: '', vigiFroid1F: '', vigiFroid2: '', vigiFroid2D: '', vigiFroid2F: '', vigiFroidD: 1700110800, vigiFroidF: 1700262000, vigiNeige: 'Vert', vigiNeige1: '', vigiNeige1D: '', vigiNeige1F: '', vigiNeige2: '', vigiNeige2D: '', vigiNeige2F: '', vigiNeigeD: 1700110800, vigiNeigeF: 1700262000, vigiOrage: 'Vert', vigiOrage1: '', vigiOrage1D: '', vigiOrage1F: '', vigiOrage2: '', vigiOrage2D: '', vigiOrage2F: '', vigiOrageD: 1700110800, vigiOrageF: 1700262000, vigiPluie: 'Vert', vigiPluie1: '', vigiPluie1D: '', vigiPluie1F: '', vigiPluie2: '', vigiPluie2D: '', vigiPluie2F: '', vigiPluieD: 1700110800, vigiPluieF: 1700262000, vigiVent: 'Vert', vigiVent1: 'Jaune', vigiVent1D: 1700154000, vigiVent1F: 1700190000, vigiVent2: 'Vert', vigiVent2D: 1700190000, vigiVent2F: 1700262000, vigiVentD: 1700110800, vigiVentF: 1700154000 }
    const spy1 = jest.spyOn(logger, 'warn')
    const spy2 = jest.spyOn(eventEmitter, 'emit').mockImplementation(() => {})
    jest.useFakeTimers({ now: new Date(2023, 10, 16, 7, 5) })
    await client.getMeteoVigilance('74', 'vigimet', 'testretour3')
    expect(spy1).not.toHaveBeenCalled()
    expect(spy2).toHaveBeenCalledWith('frame', 'vigimet/vigilance', res)
  })
  test('should return warn no data with only J1 data', async () => {
    const spy1 = jest.spyOn(logger, 'warn')
    await client.getMeteoVigilance('74', 'vigimet', 'reponsej1')
    expect(spy1).toHaveBeenCalledWith('Pas de données de vigilance pour ce jour')
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
    const res = { ferCejour: 0, ferNom: '', ferProchaindate: '15/08', ferProchainjour: 10, ferProchainnom: 'Assomption' }
    const spy = jest.spyOn(eventEmitter, 'emit').mockImplementation(() => {})
    jest.useFakeTimers({ now: new Date(2025, 7, 5) })
    await client.getJourFerie('42', 'topic')
    expect(spy).toHaveBeenCalledWith('frame', 'topic/ferie', res)
  })
  test('Should return correct value for Alsace-Moselle', async () => {
    const res = { ferCejour: 1, ferNom: 'Jour de Noël', ferProchaindate: '26/12', ferProchainjour: 1, ferProchainnom: '2ème jour de Noël' }
    const spy = jest.spyOn(eventEmitter, 'emit').mockImplementation(() => {})
    jest.useFakeTimers({ now: new Date(2024, 11, 25) })
    await client.getJourFerie('67', 'topic')
    expect(spy).toHaveBeenCalledWith('frame', 'topic/ferie', res)
  })
  test('Should return correct value for ferie', async () => {
    const res = { ferCejour: 1, ferNom: 'Jour de Noël', ferProchaindate: '01/01', ferProchainjour: 7, ferProchainnom: '1er janvier' }
    const spy = jest.spyOn(eventEmitter, 'emit').mockImplementation(() => {})
    jest.useFakeTimers({ now: new Date(2024, 11, 25) })
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
    const res = { vacCejour: 0, vacFin: '', vacNom: '', vacProchaindate: '23/12', vacProchainjour: 18, vacProchainom: 'Vacances de Noël' }
    const spy = jest.spyOn(eventEmitter, 'emit').mockImplementation(() => {})
    jest.useFakeTimers({ now: new Date(2023, 11, 5) })
    await client.getVacances('A', 'topic')
    expect(spy).toHaveBeenCalledWith('frame', 'topic/vacances', res)
  })
  test('Should return correct value for Zone B', async () => {
    const res = { vacCejour: 0, vacFin: '', vacNom: '', vacProchaindate: '24/02', vacProchainjour: 1, vacProchainom: "Vacances d'Hiver" }
    const spy = jest.spyOn(eventEmitter, 'emit').mockImplementation(() => {})
    jest.useFakeTimers({ now: new Date(2024, 1, 23) })
    await client.getVacances('B', 'topic')
    expect(spy).toHaveBeenCalledWith('frame', 'topic/vacances', res)
  })
  test('Should return correct value for Zone C', async () => {
    const res = { vacCejour: 1, vacFin: 1, vacNom: "Vacances d'Hiver", vacProchaindate: '06/04', vacProchainjour: 40, vacProchainom: 'Vacances de Printemps' }
    const spy = jest.spyOn(eventEmitter, 'emit').mockImplementation(() => {})
    jest.useFakeTimers({ now: new Date(2024, 1, 25) })
    await client.getVacances('C', 'topic')
    expect(spy).toHaveBeenCalledWith('frame', 'topic/vacances', res)
  })
  test('Should return correct value for Zone CORSE', async () => {
    const res = { vacCejour: 1, vacFin: 14, vacNom: 'Vacances de Printemps', vacProchaindate: '20/05', vacProchainjour: 21, vacProchainom: 'Lundi de Pentecôte' }
    const spy = jest.spyOn(eventEmitter, 'emit').mockImplementation(() => {})
    jest.useFakeTimers({ now: new Date(2024, 3, 29) })
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
      .onGet('/portail-api', { params: { type: 'params' } }).reply(401, '<ams:message>Invalid Credentials</ams:message>')
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
  test('should return api error', async () => {
    const spy1 = jest.spyOn(logger, 'warn')
    const res = await client.request('/portail-api', { type: 'params' })
    expect(spy1).toHaveBeenCalledWith('HTTP request /portail-api failed: Invalid Credentials. Make sure you have provided the correct security credentials')
    expect(res).toStrictEqual({})
  })
  test('should print warning in case of bad request', async () => {
    const spy1 = jest.spyOn(logger, 'warn')
    const res = await client.request('/404', { type: 'params' })
    expect(spy1).toHaveBeenCalledWith('HTTP request /404 failed: Request failed with status code 404')
    expect(res).toStrictEqual(undefined)
  })
})
