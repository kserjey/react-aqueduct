import React from 'react';
import hoistNonReactStatics from 'hoist-non-react-statics';
import createRequest from './createRequest';
import { getDisplayName } from './utils';

const defaultOptions = {
  mapPropsToValue: props => Object.keys(props).filter(key => typeof props[key] !== 'function'),
  mapPropsToRequest: () => null
};

function withRequest(options) {
  const {
    mapPropsToValue,
    mapPropsToRequest
  } = Object.assign(Object.create(null), defaultOptions, options);

  const RequestComponent = createRequest(null, mapPropsToRequest);

  return (Component) => {
    const componentDisplayName = getDisplayName(Component);

    class RequestHOC extends React.Component {
      static displayName = `withRequest(${componentDisplayName})`;

      renderRequest = requestProps => (
        <Component {...this.props} {...requestProps}/>
      );

      render() {
        return (
          <RequestComponent
            {...this.props}
            initialValue={mapPropsToValue(this.props)}
            render={this.renderRequest}
          />
        );
      }
    }

    return hoistNonReactStatics(RequestHOC, Component);
  };
}

export default withRequest;
