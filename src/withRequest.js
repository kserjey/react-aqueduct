import React from 'react';
import hoistNonReactStatics from 'hoist-non-react-statics';
import isEqual from 'lodash/isEqual';
import createRequest from './createRequest';
import { getDisplayName } from './utils';

const defaultOptions = {
  shouldDataUpdate: (props, nextProps) => !isEqual(props, nextProps),
  mapPropsToValue: () => undefined,
  mapPropsToRequest: () => null
};

function withRequest(options) {
  const {
    mapPropsToValue,
    mapPropsToRequest,
    ...requestOptions
  } = Object.assign({}, defaultOptions, options);

  const RequestComponent = createRequest(
    undefined,
    mapPropsToRequest,
    requestOptions
  );

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
