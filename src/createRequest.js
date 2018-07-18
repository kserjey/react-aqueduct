import React from 'react';
import PropTypes from 'prop-types';
import { polyfill } from 'react-lifecycles-compat';
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
const getRenderProps = state => omit(state, ['requestId', 'requestProps']);

function createRequest(initialValue, mapPropsToRequest) {
  class RequestComponent extends React.Component {
    static propTypes = propTypes;
    static defaultProps = {
      initialValue,
      onFulfilled: () => {},
      onRejected: () => {}
    };

    static getDerivedStateFromProps(nextProps, { requestProps, requestId }) {
      const nextRequestProps = getRequestProps(nextProps);

      if (!shallowEqual(requestProps, nextRequestProps)) {
        return { requestId: requestId + 1, requestProps: nextRequestProps };
      }

      return null;
    }

    constructor(props) {
      super(props);
      const requestProps = getRenderProps(this.props);
      const request = mapPropsToRequest(requestProps);

      this.request = isPromise(request) ? request : null;
      this.state = {
        isLoading: !!this.request,
        requestId: 0,
        requestProps,
        args: {},
        data: props.initialValue,
        error: null
      };
    }

    componentDidMount() {
      this.handleRequest();
    }

    componentDidUpdate(prevProps, prevState) {
      const { requestId, requestProps } = this.state;
      if (prevState.requestId < requestId) {
        const request = mapPropsToRequest(requestProps);
        this.request = isPromise(request) ? request : null;
        this.handleRequest();
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

    handleRequest = () => {
      if (this.request === null) return;
      const { requestId, requestProps: args } = this.state;
      this.setLoading(true);
      this.request.then(
        (data) => {
          if (!this.hasUnmounted && this.state.requestId === requestId) {
            this.setState({ args, data, isLoading: false, error: null }, () =>
              this.props.onFulfilled(data)
            );
          }
        },
        (error) => {
          if (!this.hasUnmounted && this.state.requestid === requestId) {
            this.setState({ args, isLoading: false, error }, () =>
              this.props.onRejected(error)
            );
          }
        }
      );
    };

    updateData = (nextArgs) => {
      this.setState(({ requestId, requestProps }) => ({
        requestId: requestId + 1,
        requestProps: Object.assign({}, requestProps, nextArgs)
      }));
    };

    render() {
      const { render, component, children } = this.props;

      const renderProps = Object.assign({}, getRenderProps(this.state), {
        updateData: this.updateData
      });

      if (component) return React.createElement(component, renderProps);
      if (render) return render(renderProps);
      if (typeof children === 'function') return children(renderProps);
      return null;
    }
  }

  return polyfill(RequestComponent);
}

export default createRequest;
