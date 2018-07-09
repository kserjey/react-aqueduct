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
      {!isLoading && <div data-testid='request-result'>{data}</div>}
      <button onClick={() => updateData()}>update</button>
    </div>
  );
}

afterEach(cleanup);

test('make request', async () => {
  const request = jest.fn(() => fakeFetch('data'));
  const FakeRequest = createRequest('', request);

  const { getByTestId } = render(
    <FakeRequest
      render={({ isLoading, data }) => (
        <div data-testid='request-result'>{isLoading ? 'loading' : data}</div>
      )}
    />
  );

  expect(request).toHaveBeenCalled();
  expect(request).toHaveBeenCalledTimes(1);
  expect(getByTestId('request-result').textContent).toBe('loading');
  await wait(() =>
    expect(getByTestId('request-result').textContent).toBe('data')
  );
});

test('do not make request if not a promise', () => {
  const request = jest.fn(() => null);
  const FakeRequest = createRequest('initial', request);

  const { getByTestId } = render(<FakeRequest component={RequestResult}/>);

  expect(getByTestId('request-result').textContent).toBe('initial');
});

test('refetch data on update props', async () => {
  const FakeRequest = createRequest('', ({ data }) => fakeFetch(data));

  function DataView(props) {
    return (
      <FakeRequest
        data={props.data}
        render={({ isLoading, data }) => (
          <div data-testid='request-result'>{isLoading ? 'loading' : data}</div>
        )}
      />
    );
  }

  const { rerender, getByTestId } = render(<DataView data='first'/>);
  expect(getByTestId('request-result').textContent).toBe('loading');
  await wait(() =>
    expect(getByTestId('request-result').textContent).toBe('first')
  );

  rerender(<DataView data='second'/>);
  await wait(() =>
    expect(getByTestId('request-result').textContent).toBe('second')
  );
});

test('fetch data only if props has been changed', async () => {
  const request = jest.fn(() => fakeFetch('data'));
  const FakeRequest = createRequest('', request);

  function DataView(props) {
    return (
      <FakeRequest
        data={props.data}
        render={({ isLoading, data }) => (
          <div data-testid='request-result'>{isLoading ? 'loading' : data}</div>
        )}
      />
    );
  }

  const { rerender, getByTestId } = render(<DataView data='first'/>);
  await wait(() =>
    expect(getByTestId('request-result').textContent).toBe('data')
  );

  rerender(<DataView data='first'/>);
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
    <FakeRequest
      render={({ isLoading, data, updateData }) => (
        <div>
          <div data-testid='request-result'>{isLoading ? 'loading' : data}</div>
          <button onClick={() => updateData()}>update</button>
        </div>
      )}
    />
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
