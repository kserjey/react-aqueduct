import React from 'react';
import hoistNonReactStatics from 'hoist-non-react-statics';
import createRequest from './createRequest';
import { getDisplayName } from './utils';

function withRequest({ initialValue, mapPropsToRequest, ...options }) {
  const RequestComponent = createRequest(initialValue, mapPropsToRequest);
  return (Component) => {
    const componentDisplayName = getDisplayName(Component);

    function RequestHOC(props) {
      return <RequestComponent {...props} {...options} component={Component}/>;
    }

    RequestHOC.displayName = `withRequest(${componentDisplayName})`;

    return hoistNonReactStatics(RequestHOC, Component);
  };
}

export default withRequest;
