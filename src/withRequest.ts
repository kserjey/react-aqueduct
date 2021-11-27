import React from 'react';
import isFunction from 'lodash/isFunction';
import hoistNonReactStatics from 'hoist-non-react-statics';
import createRequest from './createRequest';
import { getDisplayName } from './utils';

const defaultOptions = {
  initialValue: null,
  shouldDataUpdate: () => false,
};

function withRequest(mapPropsToRequest, options) {
  const { initialValue, ...requestOptions } = {
    ...defaultOptions,
    ...options,
  };

  return (Component) => {
    const componentDisplayName = getDisplayName(Component);

    class RequestHOC extends React.Component {
      constructor(props) {
        super(props);
        this.RequestComponent = createRequest(
          isFunction(initialValue) ? initialValue(initialValue) : initialValue,
          mapPropsToRequest,
          requestOptions,
        );
      }

      renderRequest = (requestProps) => (
        // eslint-disable-next-line react/jsx-props-no-spreading
        <Component {...this.props} {...requestProps} />
      );

      render() {
        return (
          // eslint-disable-next-line react/jsx-props-no-spreading
          <this.RequestComponent {...this.props} render={this.renderRequest} />
        );
      }
    }

    RequestHOC.displayName = `withRequest(${componentDisplayName})`;
    return hoistNonReactStatics(RequestHOC, Component);
  };
}

export default withRequest;
