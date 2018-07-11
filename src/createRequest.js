import React from 'react';
import PropTypes from 'prop-types';
import { polyfill } from 'react-lifecycles-compat';
import omit from 'lodash/omit';
import pick from 'lodash/pick';
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

    state = {
      isLoading: true,
      requestId: 0,
      requestProps: getRequestProps(this.props),
      args: {},
      data: this.props.initialValue,
      error: null
    };

    componentDidMount() {
      this.mounted = true;
      this.fetchData();
    }

    componentDidUpdate(prevProps, prevState) {
      if (prevState.requestId < this.state.requestId) {
        this.fetchData();
      }
    }

    componentWillUnmount() {
      this.mounted = false;
    }

    mounted = false;

    fetchData = () => {
      const { isLoading, requestId, requestProps } = this.state;
      const usedKeys = [];
      const proxy = new Proxy(requestProps, {
        get(target, key) {
          usedKeys.push(key);
          return target[key];
        }
      });

      const request = mapPropsToRequest(proxy);
      const args = pick(requestProps, usedKeys);

      if (isPromise(request)) {
        if (isLoading === false) {
          this.setState({ isLoading: true });
        }

        request.then(
          (data) => {
            if (this.mounted && this.state.requestId === requestId) {
              this.setState({ args, data, isLoading: false, error: null }, () =>
                this.props.onFulfilled(data)
              );
            }
          },
          (error) => {
            if (this.mounted && this.state.requestid === requestId) {
              this.setState({ args, isLoading: false, error }, () =>
                this.props.onRejected(error)
              );
            }
          }
        );
      } else if (isLoading === true) {
        this.setState({ isLoading: false });
      }
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
