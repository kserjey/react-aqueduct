/* eslint-disable react/prop-types */
import React from 'react';
import { render, wait, fireEvent, cleanup } from 'react-testing-library';
import createRequest from '../createRequest';

const defaultRequest = { delay: 100, error: false };
function fakeFetch(data, options) {
  const { delay, error } = Object.assign({}, defaultRequest, options);
  return new Promise((resolve, reject) => {
    setTimeout(error ? reject : resolve, delay, data);
  });
}

function RequestResult({ isLoading, data, updateData }) {
  return (
    <div>
      <div data-testid='request-result'>{isLoading ? 'loading' : data}</div>
      <button onClick={() => updateData()}>update</button>
    </div>
  );
}

afterEach(cleanup);

test('make request', async () => {
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

test('call onFulfilled on success response', (done) => {
  const FakeRequest = createRequest('', () => fakeFetch('data'));
  const callback = (data) => {
    expect(data).toBe('data');
    done();
  };

  render(<FakeRequest onFulfilled={callback}/>);
});

test('call onRejected on failed response', (done) => {
  const FakeRequest = createRequest('', () =>
    fakeFetch('error', { error: true }),
  );

  const callback = (error) => {
    expect(error).toBe('error');
    done();
  };

  render(<FakeRequest onRejected={callback}/>);
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

test('do not make request if not a promise', () => {
  const request = jest.fn(() => null);
  const FakeRequest = createRequest('initial', request);

  const { getByTestId } = render(<FakeRequest component={RequestResult}/>);

  expect(getByTestId('request-result').textContent).toBe('initial');
});

test('refetch data on update props', async () => {
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

test('do not refetch if props have not been changed', async () => {
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

test('custom shouldDataUpdate', async () => {
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

test('refetch data on updateData', async () => {
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

test('should not handle response after component has been unmounted', (done) => {
  console.error = jest.fn(console.error);
  const FakeRequest = createRequest('', () => fakeFetch('data'));
  const { unmount } = render(<FakeRequest component={RequestResult}/>);
  unmount();
  setTimeout(() => {
    expect(console.error).not.toHaveBeenCalled();
    done();
  }, 300);
});
