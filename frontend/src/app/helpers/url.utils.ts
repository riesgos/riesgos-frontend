
export function getSearchParamsHashRouting(url = window.location.href) {
  if (url.indexOf('http') === -1) {
    url = new URL(url, `${window.location.origin}${window.location.pathname}`).toString();
  }

  const urlHashRouting = new URL(url, window.location.origin);
  const [hash, queryString] = urlHashRouting.hash.split('?');

  // hash: "", pathname: "/.../map", search: "?bookmarkId=ccinf"
  // const urlWithSearch = parse(window.location.href.replace('#/', ''));
  let query = new URLSearchParams();
  if (queryString) {
    query = new URLSearchParams(queryString);
  }

  return {
    query,
    urlHashRouting,
    hash
  };
}

export function updateSearchParamsHashRouting(params: { [key: string]: string }) {
  const { query, urlHashRouting, hash } = getSearchParamsHashRouting();
  Object.keys(params).map(key => {
    query.set(key, params[key]);
  });
  const newQueryString = decodeURIComponent(`${query}`);
  const newUrl = `${urlHashRouting.protocol}//${urlHashRouting.host}${urlHashRouting.pathname || '/'}${hash || '#/'}?${newQueryString}`;
  return newUrl;
}
