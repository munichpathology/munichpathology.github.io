const publicationList = document.getElementById('publicationList');
const authorFilter = document.getElementById('authorFilter');
const zoteroGroupId = '6082964';
const zoteroEndpoint = `https://api.zotero.org/groups/${zoteroGroupId}/items?format=json&limit=100&order=desc&include=data&key=litMX2JPsReNZF2wvaQjnn4Y`;
let zoteroItems = [];

const formatAuthors = (creators = []) => {
  const names = creators
    .filter(c => c.name || c.firstName || c.lastName)
    .map(c => c.name || [c.firstName, c.lastName].filter(Boolean).join(' '));

  if (!names.length) return '';
  if (names.length <= 3) return names.join(', ');
  return `${names.slice(0, 3).join(', ')} et al.`;
};

const getPublicationYear = item => {
  const year = item.data.publicationYear || item.data.date?.slice(0, 4);
  return year || 'n.d.';
};

const getLink = item => {
  if (item.data.url) return item.data.url;
  if (item.data.DOI) return `https://doi.org/${item.data.DOI}`;
  return null;
};

const createPublicationHtml = item => {
  const authors = formatAuthors(item.data.creators);
  const title = item.data.title || 'Untitled publication';
  const journal = item.data.publicationTitle || item.data.publication || item.data.archiveTitle || '';
  const year = getPublicationYear(item);
  const link = getLink(item);
  const sourceText = journal ? `${journal}, ${year}` : year;
  const anchor = link ? ` <a href="${link}" target="_blank" rel="noreferrer noopener">${journal ? journal : 'View publication'}</a>` : '';

  return `
    <article class="publication-item">
      <p>
        ${authors ? `${authors}. ` : ''}
        <strong>${title}</strong> ${sourceText}.${anchor}
      </p>
    </article>
  `;
};

const authorMatches = (item, query) => {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return true;
  return (item.data.creators || []).some(author => {
    const name = author.name || [author.firstName, author.lastName].filter(Boolean).join(' ');
    return name.toLowerCase().includes(normalizedQuery);
  });
};

const renderPublications = items => {
  if (!items.length) {
    publicationList.innerHTML = `
      <article class="publication-item">
        <p>No publications matched that author filter.</p>
      </article>
    `;
    return;
  }

  const sortedItems = items
    .filter(item => item.data && item.data.title)
    .sort((a, b) => {
      const yearA = parseInt(getPublicationYear(a), 10) || 0;
      const yearB = parseInt(getPublicationYear(b), 10) || 0;
      return yearB - yearA;
    })
    .slice(0, 12);

  publicationList.innerHTML = sortedItems.map(createPublicationHtml).join('');
};

const showError = message => {
  publicationList.innerHTML = `
    <article class="publication-item">
      <p>Unable to load publications: ${message}</p>
    </article>
  `;
};

const updateFilter = () => {
  const query = authorFilter.value;
  const filtered = zoteroItems.filter(item => authorMatches(item, query));
  renderPublications(filtered);
};

if (authorFilter) {
  authorFilter.addEventListener('input', updateFilter);
}

(async () => {
  if (!publicationList) return;

  try {
    const response = await fetch(zoteroEndpoint);
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }

    const items = await response.json();
    zoteroItems = items;
    renderPublications(items);
  } catch (error) {
    showError(error.message);
  }
})();
