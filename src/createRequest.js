import React from 'react';
import PropTypes from 'prop-types';
import omit from 'lodash/omit';
import { shallowEqual, isPromise } from './utils';

const propTypes = {
  initialValue: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.number,
    PropTypes.string,
    PropTypes.array,
    PropTypes.object
  ]),
  component: PropTypes.func,
  render: PropTypes.func,
  children: PropTypes.oneOfType([PropTypes.func, PropTypes.node]),
  onFulfilled: PropTypes.func,
  onRejected: PropTypes.func
};

const getRequestProps = props => omit(props, Object.keys(propTypes));

function createRequest(initialValue, mapPropsToRequest) {
  return class RequestComponent extends React.Component {
    static propTypes = propTypes;
    static defaultProps = {
      initialValue,
      onFulfilled: () => {},
      onRejected: () => {}
    };

    constructor(props) {
      super(props);
      const requestProps = getRequestProps(this.props);
      const request = mapPropsToRequest(requestProps);
      this.request = isPromise(request) ? request : null;
      this.state = {
        isLoading: this.request !== null,
        args: {},
        data: props.initialValue,
        error: null
      };
    }

    componentDidMount() {
      if (this.state.isLoading) {
        this.handleRequest(this.request);
      }
    }

    componentDidUpdate(prevProps) {
      const requestProps = getRequestProps(this.props);
      if (!shallowEqual(getRequestProps(prevProps), requestProps)) {
        this.request = mapPropsToRequest(requestProps);
        if (isPromise(this.request)) {
          this.handleRequest(this.request, requestProps);
        }
      }
    }

    componentWillUnmount() {
      this.hasUnmounted = true;
    }

    setLoading = (value) => {
      if (this.state.isLoading !== value) {
        this.setState({ isLoading: value });
      }
    };

    request = null;
    hasUnmounted = false;

    handleRequest = (request, args = getRequestProps(this.props)) => {
      this.setLoading(true);
      request.then(
        (data) => {
          if (!this.hasUnmounted && this.request === request) {
            this.setState({ args, data, isLoading: false, error: null }, () =>
              this.props.onFulfilled(data)
            );
          }
        },
        (error) => {
          if (!this.hasUnmounted && this.request === request) {
            this.setState({ args, isLoading: false, error }, () =>
              this.props.onRejected(error)
            );
          }
        }
      );
    };

    updateData = (nextArgs) => {
      const requestProps = Object.assign({}, this.state.requestProps, nextArgs);
      if (!shallowEqual(this.props, requestProps)) {
        this.request = mapPropsToRequest(requestProps);
        if (isPromise(this.request)) {
          this.handleRequest(this.request, requestProps);
        }
      }
    };

    render() {
      const { render, component, children } = this.props;

      const renderProps = Object.assign({}, this.state, {
        updateData: this.updateData
      });

      if (component) return React.createElement(component, renderProps);
      if (render) return render(renderProps);
      if (typeof children === 'function') return children(renderProps);
      return null;
    }
  };
}

export default createRequest;
