# mqtt4frenchtools

![npm](https://img.shields.io/npm/v/mqtt4frenchtools)
![License](https://img.shields.io/github/license/WoCha-FR/mqtt4frenchtools)
[![Build Status](https://app.travis-ci.com/WoCha-FR/mqtt4frenchtools.svg?branch=main)](https://app.travis-ci.com/WoCha-FR/mqtt4frenchtools)
[![Coverage Status](https://coveralls.io/repos/github/WoCha-FR/mqtt4frenchtools/badge.svg?branch=main)](https://coveralls.io/github/WoCha-FR/mqtt4frenchtools?branch=main)
![npm](https://img.shields.io/npm/dt/mqtt4frenchtools)

Publish values from french open api to MQTT and other usefull data.

### Data published

- Year information (number of days in year, day number in year, week number, ...)
- Saint of the day
- EDF Tempo color of today and tomorrow

And for each city provided as parameter :
- City information (INSEE code, School Zone, Latitude & Longitude, ...)
- Sun information (sunset, sunrise, ...)
- Moon Information (moonset, moonrise, ....)
- Statutory holiday (with Alsace-Moselle)
- School holidays (of the city School Zone)
- Wethear Alert

### API Used

- [geo.api.gouv.fr](https://geo.api.gouv.fr/)
- [Risques Météorologiques](https://public.opendatasoft.com/explore/dataset/risques-meteorologiques-copy/api/)
- [Le calendrier scolaire](https://data.education.gouv.fr/explore/dataset/fr-en-calendrier-scolaire/information/)
- [Jours fériés en France](https://calendrier.api.gouv.fr/jours-feries/)

## Installing

Simply install the package over npm. This will install all the required dependencies.

```
npm install -g mqtt4frenchtools
```

## Usage

```
Usage: mqtt4frenchtools [options]

Options:
  -a, --ville         ville                                              [array]
  -u, --mqttUrl       mqtt broker url              [default: "mqtt://127.0.0.1"]
  -t, --mqttTopic     mqtt topic prefix                 [default: "frenchtools"]
  -v, --logVerbosity  log verbosity
                   [choices: "error", "warn", "info", "debug"] [default: "info"]
  -s, --sslVerify     allow ssl connections with invalid certs
      --version       Show version number                              [boolean]
  -h, --help          Show help                                        [boolean]
```

### Example

```
mqtt4apcaccess -u mqtt://192.168.5.1 -a Lyon
```

## MQTT Frame Output

```
frenchtools/global/saints
{
  "saintj":"Jour de l'an",
  "saintj1":"Basile"
  "saintsj":"Sainte Agnès, Saint Almer, Saint Augustien, Saint Edme.",
  "saintsj1":"Saint Aciscle, Saint Alphée, Saint Denis d'Alexandrie."
}
```

```
frenchtools/global/annee
{
  "nbjouran":365,
  "numjouran":320,
  "dstdate":"26/03/2023",
  "dstdiff":130,
  "numsem":46
}
```

```
frenchtools/global/edftempo
{
  "coulj":"TEMPO_BLEU",
  "coulj1":"TEMPO_BLEU",
  "nb_bleu":222,
  "nb_blanc":43,
  "nb_rouge":22,
  "tempodebut":"01/092022",
  "tempofin":"31/08/2023"
}
```

```
frenchtools/Lyon69/infos
{
  "nom":"Lyon",
  "insee":"69123",
  "deptnum":"69",
  "deptnom":"Rhône",
  "longitude":4.8351,
  "latitude":45.758,
  "zonevacances":"A"
}
```

```
frenchtools/Lyon69/ferie
{
  "jourestferie":0,
  "journomferie":"",
  "prochainfdate":"25/12",
  "prochainfnom":"Jour de Noël",
  "prochainfdif":39
}
```

```
frenchtools/Lyon69/vacances
{
  "jourestvacance":0,
  "journomvacance":"",
  "jourfinvacance":"",
  "prochainvacdate":"17/12",
  "prochainvacnom":"Vacances de Noël",
  "prochainvacdif":30
}
```

```
frenchtools/Lyon69/soleil
{
  "soleillever":"7:42",
  "soleilzenith":"12:26",
  "soleilcoucher":"17:10",
  "soleilelevation":"6.64",
  "soleilelevzenith":"25.54",
  "soleilposv":"-0.70",
  "soleilposh":"209.80",
  "jourduree":"9:28",
  "jourdifference":"-3m26s"
}
```

```
frenchtools/Lyon69/lune
{
  "lunelever":"23:59",
  "lunecoucher":"14:13",
  "lunelevation":"-16.71",
  "lunetoujours":0,
  "luneabsente":0,
  "lunephase":"Dernier quartier"
}
```

```
frenchtools/Lyon69/vigilance
{
  "vent":"Vert",
  "orage":"Vert",
  "pluie_inondation":"Vert",
  "inondation":"Vert",
  "neige":"Vert",
  "canicule":"Vert",
  "grandfroid":"Vert",
  "avalanches":"Vert",
  "vague_submersion":"Vert",
  "crue":"",
  "conseil":"",
  "commentaire":""
}
```

## Versioning

mqtt4apcaccess is maintained under the [semantic versioning](https://semver.org/) guidelines.

See the [releases](https://github.com/WoCha-FR/mqtt4frenchtools/releases) on this repository for changelog.

## License

This project is licensed under MIT License - see the [LICENSE](LICENSE.md) file for details
