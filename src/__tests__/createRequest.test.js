import React from 'react';
import { render, wait, fireEvent, cleanup } from 'react-testing-library';
import createRequest from '../createRequest';
import { fakeFetch } from './utils';

function RequestResult({ isLoading, data, updateData }) {
  return (
    <div>
      <div data-testid='request-result'>{isLoading ? 'loading' : data}</div>
      <button type='button' onClick={() => updateData()}>
        update
      </button>
    </div>
  );
}

afterEach(cleanup);

test('make a request', async () => {
  const request = jest.fn(() => fakeFetch('data'));
  const FakeRequest = createRequest('', request);

  const { getByTestId } = render(<FakeRequest component={RequestResult}/>);

  expect(request).toHaveBeenCalled();
  expect(request).toHaveBeenCalledTimes(1);
  expect(getByTestId('request-result').textContent).toBe('loading');
  await wait(() =>
    expect(getByTestId('request-result').textContent).toBe('data'),
  );
});

test('call onFulfilled when a request completes successfully', (done) => {
  const FakeRequest = createRequest('', () => fakeFetch('data'));
  const callback = (data) => {
    expect(data).toBe('data');
    done();
  };

  render(<FakeRequest onFulfilled={callback}/>);
});

test('call onRejected when a request fails', (done) => {
  const FakeRequest = createRequest('', () =>
    fakeFetch('error', { error: true }),
  );

  const callback = (error) => {
    expect(error).toBe('error');
    done();
  };

  render(<FakeRequest onRejected={callback}/>);
});

test('do not make a reqeust if not a promise', () => {
  const request = jest.fn(() => null);
  const FakeRequest = createRequest('initial', request);

  const { getByTestId } = render(<FakeRequest component={RequestResult}/>);

  expect(getByTestId('request-result').textContent).toBe('initial');
});

test('do nothing if props have not been changed', async () => {
  const request = jest.fn(() => fakeFetch('data'));
  const FakeRequest = createRequest('', request);

  const { rerender, getByTestId } = render(
    <FakeRequest data='first' component={RequestResult}/>,
  );

  await wait(() =>
    expect(getByTestId('request-result').textContent).toBe('data'),
  );

  rerender(<FakeRequest data='first' component={RequestResult}/>);
  expect(request).toHaveBeenCalledTimes(1);
  expect(getByTestId('request-result').textContent).toBe('data');
});

test('refetch data when props have changed', async () => {
  const FakeRequest = createRequest('', ({ data }) => fakeFetch(data));

  const { rerender, getByTestId } = render(
    <FakeRequest data='first' component={RequestResult}/>,
  );

  expect(getByTestId('request-result').textContent).toBe('loading');
  await wait(() =>
    expect(getByTestId('request-result').textContent).toBe('first'),
  );

  rerender(<FakeRequest data='second' component={RequestResult}/>);
  await wait(() =>
    expect(getByTestId('request-result').textContent).toBe('second'),
  );
});

test('refetch data only if shouldDataUpdate returns true', async () => {
  const request = jest.fn(({ data }) => fakeFetch(data));
  const FakeRequest = createRequest('', request, {
    shouldDataUpdate: (props, nextProps) => props.id !== nextProps.id,
  });

  const { rerender, getByTestId } = render(
    <FakeRequest id={1} data='first' component={RequestResult}/>,
  );

  await wait(() =>
    expect(getByTestId('request-result').textContent).toBe('first'),
  );

  rerender(<FakeRequest id={1} data='second' component={RequestResult}/>);
  expect(request).toHaveBeenCalledTimes(1);
  expect(getByTestId('request-result').textContent).toBe('first');
});

test('debounce', async () => {
  const request = jest.fn(({ id, query }) => fakeFetch(`${id}-${query}`));
  const FakeRequest = createRequest('', request, {
    debounce: (props, nextProps) => {
      if (props.query !== nextProps.query) return 500;
      return false;
    },
  });

  const { rerender, getByTestId } = render(
    <FakeRequest id={1} query='' component={RequestResult}/>,
  );

  rerender(<FakeRequest id={1} query='q' component={RequestResult}/>);
  rerender(<FakeRequest id={1} query='que' component={RequestResult}/>);
  rerender(<FakeRequest id={1} query='query' component={RequestResult}/>);
  await wait(() =>
    expect(getByTestId('request-result').textContent).toBe('1-query'),
  );
  expect(request).toHaveBeenCalledTimes(2);
});

test('pass used args', async () => {
  const FakeRequest = createRequest('', ({ data }) => fakeFetch(data));
  const { getByTestId } = render(
    <FakeRequest
      data='data'
      render={({ args }) => <div data-testid='argument'>{args.data}</div>}
    />,
  );

  expect(getByTestId('argument').textContent).toBe('');
  await wait(() => expect(getByTestId('argument').textContent).toBe('data'));
});

test('refetch data when updateData is called', async () => {
  let callsCount = 0;
  const FakeRequest = createRequest('', () => {
    callsCount += 1;
    return fakeFetch(`data-${callsCount}`);
  });

  const { getByTestId, getByText } = render(
    <FakeRequest component={RequestResult}/>,
  );

  await wait(() =>
    expect(getByTestId('request-result').textContent).toBe('data-1'),
  );

  fireEvent.click(getByText('update'));

  expect(callsCount).toBe(2);
  expect(getByTestId('request-result').textContent).toBe('loading');
  await wait(() =>
    expect(getByTestId('request-result').textContent).toBe('data-2'),
  );
});

test('refetch data when updateData is called with new args', async () => {
  const request = jest.fn(({ data }) => fakeFetch(data));
  const FakeRequest = createRequest('', request);
  const { getByTestId, getByText } = render(
    <FakeRequest
      data='props'
      render={({ isLoading, data, updateData }) => (
        <div>
          <div data-testid='request-result'>{isLoading ? 'loading' : data}</div>
          <button type='button' onClick={() => updateData({ data: 'inner' })}>
            update
          </button>
        </div>
      )}
    />,
  );

  await wait(() =>
    expect(getByTestId('request-result').textContent).toBe('props'),
  );

  fireEvent.click(getByText('update'));

  await wait(() => {
    expect(getByTestId('request-result').textContent).toBe('inner');
  });
});

test('do not handle response after component has been unmounted', (done) => {
  console.error = jest.fn(console.error);
  const FakeRequest = createRequest('', () => fakeFetch('data'));
  const { unmount } = render(<FakeRequest component={RequestResult}/>);
  unmount();
  setTimeout(() => {
    expect(console.error).not.toHaveBeenCalled();
    done();
  }, 300);
});
