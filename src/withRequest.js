import React from 'react';
import hoistNonReactStatics from 'hoist-non-react-statics';
import createRequest from './createRequest';
import { getDisplayName } from './utils';

function withRequest({ initialValue, mapPropsToRequest }) {
  const RequestComponent = createRequest(initialValue, mapPropsToRequest);
  return (Component) => {
    const componentDisplayName = getDisplayName(Component);

    class RequestHOC extends React.Component {
      static displayName = `withRequest(${componentDisplayName})`;
      renderRequest = requestProps => <RequestComponent {...this.props} {...requestProps}/>
      render() {
        return <RequestComponent render={this.renderRequest}/>;
      }
    }

    return hoistNonReactStatics(RequestHOC, Component);
  };
}

export default withRequest;
