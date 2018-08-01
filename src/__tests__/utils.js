const defaultFetchOptions = { delay: 100, error: false };

export function fakeFetch(data, options) {
  const { delay, error } = Object.assign({}, defaultFetchOptions, options);
  return new Promise((resolve, reject) => {
    setTimeout(error ? reject : resolve, delay, data);
  });
}
