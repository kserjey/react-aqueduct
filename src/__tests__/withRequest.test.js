import React from 'react';
import { render, waitFor } from '@testing-library/react';
import withRequest from '../withRequest';
import { fakeFetch } from './utils';

function RequestResult({ isLoading, data, updateData }) {
  return (
    <div>
      <div data-testid="request-result">{isLoading ? 'loading' : data}</div>
      <button type="button" onClick={() => updateData()}>
        update
      </button>
    </div>
  );
}

test('make a request', async () => {
  const mapPropsToRequest = jest.fn(({ id }) => fakeFetch(`${id}-data`));
  const FakeComponent = withRequest(mapPropsToRequest)(RequestResult);

  const { getByTestId } = render(<FakeComponent id={5} />);
  expect(mapPropsToRequest).toHaveBeenCalled();
  expect(mapPropsToRequest).toHaveBeenCalledTimes(1);
  expect(getByTestId('request-result').textContent).toBe('loading');
  await waitFor(() =>
    expect(getByTestId('request-result').textContent).toBe('5-data'),
  );
});

test('make request if shouldDataUpdate returns true', () => {
  const mapPropsToRequest = jest.fn(({ id, title }) =>
    fakeFetch(`${id}-${title}`),
  );

  const FakeComponent = withRequest(mapPropsToRequest, {
    shouldDataUpdate: (props, nextProps) => props.id !== nextProps.id,
  })(RequestResult);

  const { rerender } = render(<FakeComponent id={5} title="first" />);
  rerender(<FakeComponent id={5} title="second" />);
  expect(mapPropsToRequest).toHaveBeenCalledTimes(1);
  rerender(<FakeComponent id={6} title="second" />);
  expect(mapPropsToRequest).toHaveBeenCalledTimes(2);
});
