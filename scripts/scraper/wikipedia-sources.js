/**
 * Wikipedia source URLs for different countries and broadcasters
 */

export const WIKIPEDIA_SOURCES = {
  brasil: [
    // Rede Globo
    {
      url: 'https://pt.wikipedia.org/wiki/Lista_de_telenovelas_da_Rede_Globo',
      broadcaster: 'Rede Globo',
      country: 'Brasil',
      type: 'list_page'
    },
    {
      url: 'https://pt.wikipedia.org/wiki/Lista_de_telenovelas_da_Rede_Globo_(d%C3%A9cada_de_2020)',
      broadcaster: 'Rede Globo',
      country: 'Brasil',
      type: 'decade_page'
    },
    {
      url: 'https://pt.wikipedia.org/wiki/Lista_de_telenovelas_da_Rede_Globo_(d%C3%A9cada_de_2010)',
      broadcaster: 'Rede Globo', 
      country: 'Brasil',
      type: 'decade_page'
    },
    // SBT
    {
      url: 'https://pt.wikipedia.org/wiki/Lista_de_telenovelas_do_SBT',
      broadcaster: 'SBT',
      country: 'Brasil',
      type: 'list_page'
    },
    // Record
    {
      url: 'https://pt.wikipedia.org/wiki/Lista_de_telenovelas_da_Record',
      broadcaster: 'Record',
      country: 'Brasil',
      type: 'list_page'
    },
    // Band
    {
      url: 'https://pt.wikipedia.org/wiki/Lista_de_telenovelas_da_Rede_Bandeirantes',
      broadcaster: 'Band',
      country: 'Brasil',
      type: 'list_page'
    }
  ],
  
  mexico: [
    {
      url: 'https://es.wikipedia.org/wiki/Anexo:Telenovelas_de_Televisa',
      broadcaster: 'Televisa',
      country: 'México',
      type: 'list_page'
    },
    {
      url: 'https://es.wikipedia.org/wiki/Anexo:Telenovelas_de_TV_Azteca',
      broadcaster: 'TV Azteca',
      country: 'México',
      type: 'list_page'
    },
    {
      url: 'https://es.wikipedia.org/wiki/Anexo:Telenovelas_mexicanas_(2020-2029)',
      broadcaster: 'Várias',
      country: 'México',
      type: 'decade_page'
    },
    {
      url: 'https://es.wikipedia.org/wiki/Anexo:Telenovelas_mexicanas_(2010-2019)',
      broadcaster: 'Várias',
      country: 'México',
      type: 'decade_page'
    }
  ],
  
  coreia: [
    {
      url: 'https://en.wikipedia.org/wiki/List_of_South_Korean_television_series',
      broadcaster: 'Várias',
      country: 'Coreia do Sul',
      type: 'list_page'
    },
    {
      url: 'https://en.wikipedia.org/wiki/List_of_KBS_television_dramas',
      broadcaster: 'KBS',
      country: 'Coreia do Sul',
      type: 'list_page'
    },
    {
      url: 'https://en.wikipedia.org/wiki/List_of_MBC_television_dramas',
      broadcaster: 'MBC',
      country: 'Coreia do Sul',
      type: 'list_page'
    },
    {
      url: 'https://en.wikipedia.org/wiki/List_of_SBS_television_dramas',
      broadcaster: 'SBS',
      country: 'Coreia do Sul',
      type: 'list_page'
    }
  ],
  
  colombia: [
    {
      url: 'https://es.wikipedia.org/wiki/Anexo:Telenovelas_de_RCN_Televisi%C3%B3n',
      broadcaster: 'RCN',
      country: 'Colômbia',
      type: 'list_page'
    },
    {
      url: 'https://es.wikipedia.org/wiki/Anexo:Telenovelas_de_Caracol_Televisi%C3%B3n',
      broadcaster: 'Caracol',
      country: 'Colômbia',
      type: 'list_page'
    }
  ],
  
  argentina: [
    {
      url: 'https://es.wikipedia.org/wiki/Anexo:Telenovelas_de_Argentina',
      broadcaster: 'Várias',
      country: 'Argentina',
      type: 'list_page'
    },
    {
      url: 'https://es.wikipedia.org/wiki/Anexo:Telenovelas_de_Canal_13_(Argentina)',
      broadcaster: 'Canal 13',
      country: 'Argentina',
      type: 'list_page'
    },
    {
      url: 'https://es.wikipedia.org/wiki/Anexo:Telenovelas_de_Telefe',
      broadcaster: 'Telefe',
      country: 'Argentina',
      type: 'list_page'
    }
  ],
  
  venezuela: [
    {
      url: 'https://es.wikipedia.org/wiki/Anexo:Telenovelas_de_Venezuela',
      broadcaster: 'Várias',
      country: 'Venezuela',
      type: 'list_page'
    }
  ],
  
  chile: [
    {
      url: 'https://es.wikipedia.org/wiki/Anexo:Telenovelas_de_Chile',
      broadcaster: 'Várias',
      country: 'Chile',
      type: 'list_page'
    }
  ],
  
  peru: [
    {
      url: 'https://es.wikipedia.org/wiki/Anexo:Telenovelas_del_Per%C3%BA',
      broadcaster: 'Várias',
      country: 'Peru',
      type: 'list_page'
    }
  ],
  
  espanha: [
    {
      url: 'https://es.wikipedia.org/wiki/Anexo:Series_de_televisi%C3%B3n_de_Espa%C3%B1a',
      broadcaster: 'Várias',
      country: 'Espanha',
      type: 'list_page'
    }
  ],
  
  portugal: [
    {
      url: 'https://pt.wikipedia.org/wiki/Lista_de_telenovelas_portuguesas',
      broadcaster: 'Várias',
      country: 'Portugal',
      type: 'list_page'
    }
  ],
  
  turquia: [
    {
      url: 'https://en.wikipedia.org/wiki/List_of_Turkish_television_series',
      broadcaster: 'Várias',
      country: 'Turquia',
      type: 'list_page'
    }
  ],
  
  india: [
    {
      url: 'https://en.wikipedia.org/wiki/List_of_Indian_television_series',
      broadcaster: 'Várias',
      country: 'Índia',
      type: 'list_page'
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