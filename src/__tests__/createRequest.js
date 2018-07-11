import React from 'react';
import { render, wait, fireEvent, cleanup } from 'react-testing-library';
import createRequest from '../createRequest';

function fakeFetch(data) {
  return new Promise((resolve) => {
    setTimeout(resolve, 300, data);
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
    expect(getByTestId('request-result').textContent).toBe('data')
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

test('pass used args', async () => {
  const FakeRequest = createRequest('', ({ data }) => fakeFetch(data));
  const { getByTestId } = render(
    <FakeRequest
      data='data'
      render={({ args }) => <div data-testid='argument'>{args.data}</div>}
    />
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
    <FakeRequest data='first' component={RequestResult}/>
  );

  expect(getByTestId('request-result').textContent).toBe('loading');
  await wait(() =>
    expect(getByTestId('request-result').textContent).toBe('first')
  );

  rerender(<FakeRequest data='second' component={RequestResult}/>);
  await wait(() =>
    expect(getByTestId('request-result').textContent).toBe('second')
  );
});

test('do not refetch if props have not been changed', async () => {
  const request = jest.fn(() => fakeFetch('data'));
  const FakeRequest = createRequest('', request);

  const { rerender, getByTestId } = render(
    <FakeRequest data='first' component={RequestResult}/>
  );

  await wait(() =>
    expect(getByTestId('request-result').textContent).toBe('data')
  );

  rerender(<FakeRequest data='first' component={RequestResult}/>);
  expect(request).toHaveBeenCalledTimes(1);
  expect(getByTestId('request-result').textContent).toBe('data');
});

test('refetch data on updateData', async () => {
  let callsCount = 0;
  const FakeRequest = createRequest('', () => {
    callsCount += 1;
    return fakeFetch(`data-${callsCount}`);
  });

  const { getByTestId, getByText } = render(
    <FakeRequest component={RequestResult}/>
  );

  await wait(() =>
    expect(getByTestId('request-result').textContent).toBe('data-1')
  );

  fireEvent.click(getByText('update'));

  expect(callsCount).toBe(2);
  expect(getByTestId('request-result').textContent).toBe('loading');
  await wait(() =>
    expect(getByTestId('request-result').textContent).toBe('data-2')
  );
});
