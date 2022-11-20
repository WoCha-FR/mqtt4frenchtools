/* eslint-disable no-undef */
const axios = require('axios')
const MockAdapter = require('axios-mock-adapter')
const mock = new MockAdapter(axios)

const InfoGlobal = require('../lib/infofrance')
const logger = require('../lib/logs')
const { eventEmitter } = require('../lib/utils')

describe('Create InfosGlobales', () => {
  test('should set user values when provided', () => {
    const client = new InfoGlobal({ timeout: 1000 })
    expect(client.requestConfig).toStrictEqual({ timeout: 1000 })
  })
  test('should return a new instance of InfosGlobales', () => {
    expect(new InfoGlobal()).toBeInstanceOf(InfoGlobal)
  })
})

describe('Test getSaints function', () => {
  const client = new InfoGlobal()
  const result = {
    saintj: 'Saint Almaque, Saint Aspaïs, Saint Castule, Saint Concorde, Sainte Euphrosyne d\'Égypte, Saint Fulgence, Saint Odilon, Saint Paracode et Saint Stable.',
    saintj1: 'Saint Adelart, Saint Basile le Grand, Saint Domne, Saint Macaire le Jeune et Saint Silain.'
  }
  afterEach(() => {
    jest.useRealTimers()
  })

  test('should return correct values for a date', async () => {
    const spy = jest.spyOn(eventEmitter, 'emit').mockImplementation(() => {})
    jest.useFakeTimers({ now: new Date(2022, 0, 1) })
    await client.getSaints()
    expect(spy).toHaveBeenCalledWith('frame', 'global/saints', result)
  })
})

describe('Test getJourSemAn function', () => {
  const client = new InfoGlobal()
  const res1 = { dstdate: '27/03', dstdiff: 85, nbjouran: 365, numjouran: 1, numsem: 52 }
  const res2 = { dstdate: '27/03/2033', dstdiff: 86, nbjouran: 366, numjouran: 366, numsem: 53 }
  const res3 = { dstdate: '27/10', dstdiff: 179, nbjouran: 366, numjouran: 122, numsem: 18 }
  afterEach(() => {
    jest.useRealTimers()
  })

  test('should return correct values 1', async () => {
    const spy = jest.spyOn(eventEmitter, 'emit').mockImplementation(() => {})
    jest.useFakeTimers({ now: new Date(2022, 0, 1) })
    await client.getJourSemAn()
    expect(spy).toHaveBeenCalledWith('frame', 'global/annee', res1)
  })
  test('should return correct values 2', async () => {
    const spy = jest.spyOn(eventEmitter, 'emit').mockImplementation(() => {})
    jest.useFakeTimers({ now: new Date(2032, 11, 31) })
    await client.getJourSemAn()
    expect(spy).toHaveBeenCalledWith('frame', 'global/annee', res2)
  })
  test('should return correct values 3', async () => {
    const spy = jest.spyOn(eventEmitter, 'emit').mockImplementation(() => {})
    jest.useFakeTimers({ now: new Date(2024, 4, 1) })
    await client.getJourSemAn()
    expect(spy).toHaveBeenCalledWith('frame', 'global/annee', res3)
  })
})

describe('Test getLastDimanche function', () => {
  const client = new InfoGlobal()
  const res1 = new Date(2022, 10, 27, 12, 0, 0, 0)
  const res2 = new Date(2022, 6, 31, 12, 0, 0, 0)

  test('should return correct values 1', () => {
    const res = client.getLastDimanche(2022, 11)
    expect(res).toStrictEqual(res1)
  })
  test('should return correct values 2', () => {
    const res = client.getLastDimanche(2022, 7)
    expect(res).toStrictEqual(res2)
  })
})

describe('EDF Tempo', () => {
  describe('Phase 1', () => {
    beforeAll(async () => {
      mock
        .onGet('searchTempoStore', { params: { dateRelevant: '2024-5-5' } }).reply(200, { couleurJourJ: 'BLEU', couleurJourJ1: 'BLEU' })
        .onGet('getNbTempoDays', { params: { TypeAlerte: 'TEMPO' } }).reply(200, { PARAM_NB_J_BLANC: 3, PARAM_NB_J_ROUGE: 1, PARAM_NB_J_BLEU: 35 })
        .onAny().reply(404)
    })
    afterAll(() => {
      mock.reset()
      jest.useRealTimers()
    })
    test('should return valid data', async () => {
      const client = new InfoGlobal()
      const res = { coulj: 'BLEU', coulj1: 'BLEU', nb_blanc: 3, nb_bleu: 35, nb_rouge: 1, tempodebut: '01/09/2023', tempofin: '31/08/2024' }
      const spy = jest.spyOn(eventEmitter, 'emit').mockImplementation(() => {})
      jest.useFakeTimers({ now: new Date(2024, 4, 5) })
      await client.getEDF()
      expect(spy).toHaveBeenCalledWith('frame', 'global/edftempo', res)
    })
  })

  describe('Phase 2', () => {
    beforeAll(async () => {
      mock
        .onGet('searchTempoStore').reply(200, {})
        .onGet('getNbTempoDays').reply(200, {})
        .onAny().reply(404)
    })
    afterAll(() => {
      mock.reset()
    })
    afterEach(() => {
      jest.useRealTimers()
    })
    test('should return right data 3', async () => {
      const client = new InfoGlobal()
      const res = { coulj: 'NO_DATA', coulj1: 'NO_DATA', nb_blanc: 'NO_DATA', nb_bleu: 'NO_DATA', nb_rouge: 'NO_DATA', tempodebut: '01/09/2023', tempofin: '31/08/2024' }
      const spy = jest.spyOn(eventEmitter, 'emit').mockImplementation(() => {})
      jest.useFakeTimers({ now: new Date(2023, 9, 5) })
      await client.getEDF()
      expect(spy).toHaveBeenCalledWith('frame', 'global/edftempo', res)
    })
  })
})

describe('Request', () => {
  let client
  beforeAll(async () => {
    mock
      .onGet('/path', { params: { type: 'params' } }).reply(200, { body: [{ type: 'getpublicdata' }] })
      .onGet('/timeout').timeout()
      .onAny().reply(404)
  })
  afterAll(() => {
    mock.reset()
  })
  beforeEach(() => {
    client = new InfoGlobal()
  })

  test('should return good result', async () => {
    const res = await client.request('/path', { type: 'params' })
    expect(res).toStrictEqual({ body: [{ type: 'getpublicdata' }] })
  })
  test('should print warning in case of timeout', async () => {
    const spy1 = jest.spyOn(logger, 'warn')
    const res = await client.request('/timeout', { type: 'params' })
    expect(spy1).toHaveBeenCalledWith('HTTP request /timeout failed: timeout of 2000ms exceeded')
    expect(res).toStrictEqual(undefined)
  })
  test('should print warning in case of bad request', async () => {
    const spy1 = jest.spyOn(logger, 'warn')
    const res = await client.request('/404', { type: 'params' })
    expect(spy1).toHaveBeenCalledWith('HTTP request /404 failed: Request failed with status code 404')
    expect(res).toStrictEqual(undefined)
  })
})
