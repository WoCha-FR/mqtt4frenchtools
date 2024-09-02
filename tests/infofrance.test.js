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
    saintj: 'Jour de l\'an',
    saintj1: 'Basile',
    saintsj: 'Saint Almaque, Saint Aspaïs, Saint Castule, Saint Concorde, Sainte Euphrosyne d\'Égypte, Saint Fulgence, Saint Odilon, Saint Paracode et Saint Stable.',
    saintsj1: 'Saint Adelart, Saint Basile le Grand, Saint Domne, Saint Macaire le Jeune et Saint Silain.'
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
  const res1 = { dstDate: '27/03', dstDiff: 85, anNbjour: 365, anNumjour: 1, anNumsem: 52 }
  const res2 = { dstDate: '27/03/2033', dstDiff: 86, anNbjour: 366, anNumjour: 366, anNumsem: 53 }
  const res3 = { dstDate: '29/10', dstDiff: 181, anNbjour: 365, anNumjour: 121, anNumsem: 18 }
  const res4 = { dstDate: '31/03', dstDiff: 90, anNbjour: 366, anNumjour: 1, anNumsem: 1 }
  const res5 = { dstDate: '29/10', dstDiff: 169, anNbjour: 365, anNumjour: 133, anNumsem: 19 }
  const res6 = { dstDate: '30/10', dstDiff: 212, anNbjour: 365, anNumjour: 91, anNumsem: 13 }
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
    jest.useFakeTimers({ now: new Date(2023, 4, 1) })
    await client.getJourSemAn()
    expect(spy).toHaveBeenCalledWith('frame', 'global/annee', res3)
  })
  test('should return correct values 4', async () => {
    const spy = jest.spyOn(eventEmitter, 'emit').mockImplementation(() => {})
    jest.useFakeTimers({ now: new Date(2024, 0, 1) })
    await client.getJourSemAn()
    expect(spy).toHaveBeenCalledWith('frame', 'global/annee', res4)
  })
  test('should return correct values 5', async () => {
    const spy = jest.spyOn(eventEmitter, 'emit').mockImplementation(() => {})
    jest.useFakeTimers({ now: new Date(2023, 4, 13) })
    await client.getJourSemAn()
    expect(spy).toHaveBeenCalledWith('frame', 'global/annee', res5)
  })
  test('should return correct values 6', async () => {
    const spy = jest.spyOn(eventEmitter, 'emit').mockImplementation(() => {})
    jest.useFakeTimers({ now: new Date(2022, 3, 1) })
    await client.getJourSemAn()
    expect(spy).toHaveBeenCalledWith('frame', 'global/annee', res6)
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
  // Test 1
  describe('Valide', () => {
    beforeAll(async () => {
      mock
        .onGet('calendrier-jours-effacement', { params: { option: 'TEMPO', dateApplicationBorneInf: '2024-09-01', dateApplicationBorneSup: '2024-09-02' } }).reply(200, { errors: [], content: { dateApplicationBorneInf: '2024-09-01', dateApplicationBorneSup: '2024-09-02', dateHeureTraitementActivET: '2024-09-01T11:43:19Z', options: [{ option: 'TEMPO', calendrier: [{ dateApplication: '2024-09-01', statut: 'TEMPO_BLEU' }, { dateApplication: '2024-09-02', statut: 'TEMPO_BLEU' }] }] } })
        .onGet('saisons/search', { params: { option: 'TEMPO', dateReference: '2024-09-01' } }).reply(200, { errors: [], content: [{ typeJourEff: 'TEMPO_BLANC', libelle: 'TEMPO BLANC 2024 2025', nombreJours: 43, premierJour: '2024-09-01', dernierJour: '2025-08-31', premierJourExclu: null, dernierJourExclu: null, nombreJoursTires: 0, etat: 'OUVERTE' }, { typeJourEff: 'TEMPO_BLEU', libelle: 'TEMPO BLEU 2024 2025', nombreJours: 300, premierJour: '2024-09-01', dernierJour: '2025-08-31', premierJourExclu: null, dernierJourExclu: null, nombreJoursTires: 2, etat: 'OUVERTE' }, { typeJourEff: 'TEMPO_ROUGE', libelle: 'TEMPO ROUGE 2024 2025', nombreJours: 22, premierJour: '2024-11-01', dernierJour: '2025-03-31', premierJourExclu: null, dernierJourExclu: null, nombreJoursTires: 0, etat: 'NON_COMMENCEE' }] })
        .onAny().reply(404)
    })
    afterAll(() => {
      mock.reset()
      jest.useRealTimers()
    })
    test('should return valid data', async () => {
      const client = new InfoGlobal()
      const res = { tempoBlanc: 43, tempoBlancDeb: '2024-09-01', tempoBlancEtat: 'OUVERTE', tempoBlancFin: '2025-08-31', tempoBlancTires: 0, tempoBlancTotal: 43, tempoBleu: 298, tempoBleuEtat: 'OUVERTE', tempoBleuTires: 2, tempoBleuTotal: 300, tempoCoulj: 'TEMPO_BLEU', tempoCoulj1: 'TEMPO_BLEU', tempoDeb: '2024-09-01', tempoFin: '2025-08-31', tempoRouge: 22, tempoRougeDeb: '2024-11-01', tempoRougeEtat: 'NON_COMMENCEE', tempoRougeFin: '2025-03-31', tempoRougeTires: 0, tempoRougeTotal: 22 }
      const spy = jest.spyOn(eventEmitter, 'emit').mockImplementation(() => {})
      jest.useFakeTimers({ now: new Date(2024, 8, 1) })
      await client.getEDF()
      expect(spy).toHaveBeenCalledWith('frame', 'global/edftempo', res)
    })
    test('should return erreur', async () => {
      const client = new InfoGlobal()
      const spy1 = jest.spyOn(logger, 'warn')
      jest.useFakeTimers({ now: new Date(2024, 10, 1) })
      await client.getEDF()
      expect(spy1).toHaveBeenCalledWith('Pas de réponse EDF Calendrier Tempo')
      expect(spy1).toHaveBeenCalledWith('Pas de réponse EDF Jours restant Tempo')
    })
  })

  // Test 2
  describe('Erreur json', () => {
    beforeAll(async () => {
      mock
        .onGet('calendrier-jours-effacement', { params: { option: 'TEMPO', dateApplicationBorneInf: '2024-09-05', dateApplicationBorneSup: '2024-09-06' } }).reply(200, { errors: [{ code: 'ATM_HTTP_400', description: 'La syntaxe de la requête est erronée.', severity: 'ERROR', type: 'TECHNICAL' }], content: null })
        .onGet('saisons/search', { params: { option: 'TEMPO', dateReference: '2024-09-05' } }).reply(200, { errors: [{ code: 'ATM_HTTP_400', description: 'La syntaxe de la requête est erronée.', severity: 'ERROR', type: 'TECHNICAL' }], content: null })
        .onAny().reply(404)
    })
    afterAll(() => {
      mock.reset()
      jest.useRealTimers()
    })
    test('should return erreur', async () => {
      const client = new InfoGlobal()
      const spy1 = jest.spyOn(logger, 'warn')
      jest.useFakeTimers({ now: new Date(2024, 8, 5) })
      await client.getEDF()
      expect(spy1).toHaveBeenCalledWith('Erreur EDF Calendrier Tempo')
      expect(spy1).toHaveBeenCalledWith('Erreur EDF Jours restant Tempo')
    })
  })
})

describe('Request', () => {
  let client
  beforeAll(async () => {
    mock
      .onGet('/path', { params: { type: 'params' } }).reply(200, { body: [{ type: 'getpublicdata' }] })
      .onGet('/timeout').timeout()
      .onGet('/err400').reply(400)
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
  test('Retry on err 400', async () => {
    const spy1 = jest.spyOn(logger, 'debug')
    const res = await client.request('/err400', { type: 'params' })
    expect(spy1).toHaveBeenCalledTimes(2)
    expect(res).toStrictEqual(undefined)
  })
})
