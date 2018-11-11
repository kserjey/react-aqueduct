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
  const { initialValue, ...requestOptions } = Object.assign(
    {},
    defaultOptions,
    options,
  );

  return (Component) => {
    const componentDisplayName = getDisplayName(Component);

    class RequestHOC extends React.Component {
      static displayName = `withRequest(${componentDisplayName})`;

      constructor(props) {
        super(props);
        this.RequestComponent = createRequest(
          isFunction(initialValue) ? initialValue(initialValue) : initialValue,
          mapPropsToRequest,
          requestOptions,
        );
      }

      renderRequest = requestProps => (
        <Component {...this.props} {...requestProps}/>
      );

      render() {
        return (
          <this.RequestComponent {...this.props} render={this.renderRequest}/>
        );
      }
    }

    return hoistNonReactStatics(RequestHOC, Component);
  };
}

export default withRequest;
