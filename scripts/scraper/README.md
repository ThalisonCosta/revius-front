# Novela Scraper - Wikipedia Scraper para Telenovelas

Este scraper coleta informações sobre telenovelas de diversos países através da Wikipedia, gerando um arquivo JSON estruturado para uso no frontend da aplicação.

## 📋 Características

- **Países suportados**: Brasil, México, Coreia do Sul, Colômbia, Argentina, Venezuela, Chile, Peru, Espanha, Portugal, Turquia, Índia
- **Emissoras cobertas**: Rede Globo, SBT, Record, Band, Televisa, TV Azteca, KBS, MBC, SBS, RCN, Caracol, e mais
- **Dados extraídos**: Título, país, emissora, ano, gêneros, sinopse, elenco, episódios, diretor, autor, URLs
- **Rate limiting**: Controle automático de velocidade para evitar sobrecarga dos servidores
- **Backup automático**: Cria backup dos dados existentes antes de sobrescrever
- **Merge inteligente**: Combina dados novos com existentes sem duplicatas

## 🚀 Como usar

### Scripts disponíveis

```bash
# Scraping completo de todos os países
npm run scrape:novelas

# Scraping apenas do Brasil
npm run scrape:novelas:brasil

# Scraping rápido (sem detalhamento extra)
npm run scrape:novelas:fast

# Atualização com detalhamento limitado
npm run scrape:novelas:update

# Validar arquivo JSON gerado
npm run validate:novelas

# Testar apenas o parsing (sem browser)
npm run scrape:test:parsing

# Teste completo do scraper
npm run scrape:test
```

### Uso programático

```javascript
import NovelaScraper from './scripts/scraper/novela-scraper.js';

const scraper = new NovelaScraper();

// Scraping básico
const result = await scraper.scrape();

// Scraping com opções específicas
const result = await scraper.scrape({
  countries: ['Brasil', 'México'],  // Apenas países específicos
  enhanceDetails: true,             // Extrair detalhes extras (mais lento)
  mergeWithExisting: true,          // Combinar com dados existentes
  maxToEnhance: 50                  // Limitar detalhamento para performance
});

if (result.success) {
  console.log(`Coletadas ${result.data.length} novelas`);
} else {
  console.error('Erro:', result.error);
}
```

### Opções de linha de comando

```bash
# Scraping de países específicos
node scripts/scraper/novela-scraper.js --countries "Brasil,México,Coreia do Sul"

# Pular detalhamento (mais rápido)
node scripts/scraper/novela-scraper.js --no-enhance

# Não fazer merge com dados existentes
node scripts/scraper/novela-scraper.js --no-merge

# Limitar número de novelas para detalhamento
node scripts/scraper/novela-scraper.js --max-enhance 20

# Ver opções disponíveis
node scripts/scraper/novela-scraper.js --help
```

## 📊 Estrutura dos dados

### Arquivo de saída: `data/novelas.json`

```json
{
  "metadata": {
    "lastUpdated": "2025-01-04T12:00:00.000Z",
    "totalNovelas": 1500,
    "countries": ["Brasil", "México", "Coreia do Sul", ...],
    "broadcasters": ["Rede Globo", "Televisa", "KBS", ...],
    "genres": ["Drama", "Romance", "Comédia", ...],
    "statistics": {
      "totalEpisodes": 180000,
      "averageEpisodes": 120,
      "yearRange": "1960-2024",
      "oldestYear": 1960,
      "newestYear": 2024
    },
    "scrapedAt": "2025-01-04T12:00:00.000Z"
  },
  "novelas": [
    {
      "id": "terra-e-paixao-1",
      "title": "Terra e Paixão",
      "country": "Brasil",
      "broadcaster": "Rede Globo",
      "year": {"start": 2023, "end": 2024},
      "genre": ["Drama", "Romance"],
      "synopsis": "Terra e Paixão é uma telenovela brasileira...",
      "cast": ["Cauã Reymond", "Bárbara Reis", ...],
      "episodes": 203,
      "director": "Rogério Gomes",
      "author": "Walcyr Carrasco",
      "wikipediaUrl": "https://pt.wikipedia.org/wiki/Terra_e_Paixão",
      "imageUrl": "https://upload.wikimedia.org/...",
      "scraped": "2025-01-04T12:00:00.000Z"
    }
  ]
}
```

## ⚙️ Configuração

### Arquivo `config.js`

```javascript
export const CONFIG = {
  // Diretórios de saída
  OUTPUT_DIR: './data',
  OUTPUT_FILE: 'novelas.json',
  BACKUP_FILE: 'novelas-backup.json',
  
  // Controle de scraping
  DELAY_BETWEEN_REQUESTS: 2000,  // 2 segundos entre requisições
  MAX_RETRIES: 3,                // Tentativas por página
  TIMEOUT: 30000,                // Timeout por página (30s)
  
  // Performance
  CONCURRENT_REQUESTS: 3,        // Requisições simultâneas
  
  // Países para scraping
  TARGET_COUNTRIES: [
    'Brasil', 'México', 'Coreia do Sul', 'Colômbia', ...
  ]
};
```

## 📚 Fontes Wikipedia

O scraper utiliza URLs específicas da Wikipedia para cada país e emissora:

### Brasil
- Lista de telenovelas da Rede Globo (por década)
- Lista de telenovelas do SBT
- Lista de telenovelas da Record
- Lista de telenovelas da Band

### México
- Telenovelas da Televisa
- Telenovelas da TV Azteca
- Listas por década

### Coreia do Sul
- Dramas da KBS, MBC, SBS
- Lista geral de séries coreanas

### Outros países
- Listas específicas por país e emissora

## 🔧 Solução de problemas

### Erro: "Failed to initialize browser"
```bash
# Instalar dependências do Playwright
npx playwright install chromium
```

### Erro: "No novelas found"
- Verifique sua conexão com a internet
- Algumas páginas da Wikipedia podem estar temporariamente indisponíveis
- Use `--countries` para testar com um país específico

### Performance lenta
```bash
# Use o modo rápido
npm run scrape:novelas:fast

# Ou limite o detalhamento
node scripts/scraper/novela-scraper.js --max-enhance 10
```

### Dados incompletos
- Execute novamente - o scraper faz merge inteligente dos dados
- Use `enhanceDetails: true` para mais informações (mais lento)

## 🔄 Agendamento (Cron Jobs)

Para atualizar automaticamente os dados:

```bash
# Adicionar ao crontab (executar a cada 3 meses)
0 0 1 */3 * cd /path/to/project && npm run scrape:novelas:update

# Ou usar GitHub Actions, Heroku Scheduler, etc.
```

## 🛡️ Rate Limiting

O scraper implementa rate limiting para ser respeitoso com os servidores da Wikipedia:
- 2 segundos de delay entre requisições
- Máximo de 3 requisições simultâneas
- User-agent identificado como navegador real
- Retry automático com backoff exponencial

## 📈 Monitoramento

O scraper fornece logs detalhados:
```
🚀 Starting Novela Scraper
📚 Found 45 Wikipedia sources to scrape
🌐 Fetching: https://pt.wikipedia.org/wiki/Lista_de_telenovelas_da_Rede_Globo
✨ Found 156 novelas from Rede Globo
📊 Progress: 15% (7/45 sources)
🎉 Scraping completed! Found 2847 novelas total
```

## 🤝 Contribuições

Para adicionar novos países ou emissoras:

1. Edite `wikipedia-sources.js`
2. Adicione as URLs das páginas Wikipedia
3. Teste com `npm run scrape:test`
4. Ajuste os parsers se necessário em `data-parser.js`

## 📄 Licença

Este scraper é apenas para uso educacional e de desenvolvimento. Respeite os termos de uso da Wikipedia e não sobrecarregue os servidores.