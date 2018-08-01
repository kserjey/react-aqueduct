import React from 'react';
import { render, wait, cleanup } from 'react-testing-library';
import withRequest from '../withRequest';
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

test('should make request on mount', async () => {
  const mapPropsToRequest = jest.fn(({ id }) => fakeFetch(`${id}-data`));
  const FakeComponent = withRequest({ mapPropsToRequest })(RequestResult);

  const { getByTestId } = render(<FakeComponent id={5}/>);
  expect(mapPropsToRequest).toHaveBeenCalled();
  expect(mapPropsToRequest).toHaveBeenCalledTimes(1);
  expect(getByTestId('request-result').textContent).toBe('loading');
  await wait(() =>
    expect(getByTestId('request-result').textContent).toBe('5-data'),
  );
});

test('should make request if shouldDataUpdate returns true', () => {
  const options = {
    mapPropsToRequest: jest.fn(({ id, title }) => fakeFetch(`${id}-${title}`)),
    shouldDataUpdate: (props, nextProps) => props.id !== nextProps.id,
  };

  const FakeComponent = withRequest(options)(RequestResult);

  const { rerender } = render(<FakeComponent id={5} title='first'/>);
  rerender(<FakeComponent id={5} title='second'/>);
  expect(options.mapPropsToRequest).toHaveBeenCalledTimes(1);
  rerender(<FakeComponent id={6} title='second'/>);
  expect(options.mapPropsToRequest).toHaveBeenCalledTimes(2);
});
