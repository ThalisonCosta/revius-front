/**
 * Wikipedia source URLs for different countries and broadcasters
 */

export const WIKIPEDIA_SOURCES = {
  brasil: [
    // Record TV
    {
      url: 'https://pt.wikipedia.org/wiki/Lista_de_telenovelas_da_Record',
      broadcaster: 'Record',
      country: 'Brasil',
      type: 'record_page',
      language: 'pt'
    },
    // TV Globo
    {
      url: 'https://en.wikipedia.org/wiki/List_of_TV_Globo_telenovelas',
      broadcaster: 'Globo',
      country: 'Brasil',
      type: 'globo_page',
      language: 'en'
    },
    // Band
    {
      url: 'https://pt.wikipedia.org/wiki/Lista_de_telenovelas_da_Band',
      broadcaster: 'Band',
      country: 'Brasil',
      type: 'band_page',
      language: 'pt'
    },
    // SBT
    {
      url: 'https://pt.wikipedia.org/wiki/Lista_de_telenovelas_do_SBT',
      broadcaster: 'SBT',
      country: 'Brasil',
      type: 'sbt_page',
      language: 'pt'
    }
  ]
};

/**
 * Get all sources flattened for iteration
 */
export function getAllSources() {
  const allSources = [];
  
  Object.keys(WIKIPEDIA_SOURCES).forEach(country => {
    allSources.push(...WIKIPEDIA_SOURCES[country]);
  });
  
  return allSources;
}

/**
 * Get sources by country
 */
export function getSourcesByCountry(country) {
  const countryKey = country.toLowerCase().replace(' ', '_');
  return WIKIPEDIA_SOURCES[countryKey] || [];
}