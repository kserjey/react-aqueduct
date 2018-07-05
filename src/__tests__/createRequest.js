import React from 'react';
import { render, wait, fireEvent, cleanup } from 'react-testing-library';
import createRequest from '../createRequest';

function fakeFetch(data) {
  return new Promise((resolve) => {
    setTimeout(resolve, 1000, data);
  });
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
