const form = document.querySelector('#airport-search');
const query = document.querySelector('#query');
const cards = [...document.querySelectorAll('.airport-card')];
function normalize(text) {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[\s-]+/g, '');
}
function filterAirports() {
  const term = normalize(query.value);
  const matches = cards.filter(card => normalize(card.dataset.search).includes(term));
  cards.forEach(card => { card.hidden = !matches.includes(card); });
  document.querySelector('#count').textContent = matches.length + ' 座机场';
  document.querySelector('#empty').hidden = matches.length > 0;
  return matches;
}
query.addEventListener('input', filterAirports);
form.addEventListener('submit', event => {
  event.preventDefault();
  const matches = filterAirports();
  if (matches.length === 1) window.location.assign(matches[0].href);
  else if (matches.length) matches[0].focus();
  else query.focus();
});
