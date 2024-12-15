const axios = require('axios');

async function validateWikipediaPage(page) {
  const url = `https://fr.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(page)}&format=json&origin=*`;

  try {
    const response = await axios.get(url);
    const pages = response.data.query.pages;
    const pageId = Object.keys(pages)[0];

    if (pageId === "-1") {
      return { valid: false, normalizedTitle: null, pageUrl: null };
    }

    const pageInfo = pages[pageId];
    const normalizedTitle = pageInfo.title;
    const pageUrl = `https://fr.wikipedia.org/wiki/${encodeURIComponent(normalizedTitle.replace(/ /g, '_'))}`;

    return { valid: true, normalizedTitle, pageUrl };
  } catch (error) {
    console.error("Erreur lors de la validation de la page Wikipedia :", error);
    return { valid: false, normalizedTitle: null, pageUrl: null };
  }
}
async function getWikiPageData(page) {
  const url = 'https://fr.wikipedia.org/w/api.php';
  const params = {
    action: 'parse',
    page: page,
    prop: 'text|links',
    format: 'json',
    redirects: 1
  };

  try {
    const response = await axios.get(url, { params });
    const data = response.data.parse;
    const links = data.links
      .filter(l => l.ns === 0 && l.exist !== '')
      .map(l => l['*'])
      .filter(name => !name.startsWith('Category:') && !name.startsWith('Help:'));
    const htmlContent = data.text["*"];
    return { links, htmlContent };
  } catch (e) {
    console.error('Error fetching page data from Wikipedia:', e);
    return { links: [], htmlContent: '' };
  }
}

module.exports = { getWikiPageData };
