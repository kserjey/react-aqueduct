import React from 'react';
import PropTypes from 'prop-types';
import polyfill from 'react-lifecycles-compat';
import { shallowEqual, omit } from './utils';

const getArgs = props => omit(props, ['render', 'onFulfilled', 'onRejected']);
const getRenderProps = state => omit(state, ['requestId']);

function createRequest(initialValue, mapPropsToRequest) {
  class RequestComponent extends React.Component {
    static propTypes = {
      waiting: PropTypes.bool,
      component: PropTypes.func,
      render: PropTypes.func,
      children: PropTypes.oneOfType([PropTypes.func, PropTypes.node]),
      onFulfilled: PropTypes.func,
      onRejected: PropTypes.func
    };

    static defaultProps = {
      waiting: false,
      onFulfilled: () => {},
      onRejected: () => {}
    };

    static getDerivedStateFromProps(nextProps, { args, requestId }) {
      const nextArgs = getArgs(nextProps);

      if (!shallowEqual(args, nextArgs)) {
        return { isLoading: true, requestId: requestId + 1, args: nextArgs };
      }

      return null;
    }

    state = {
      isLoading: true,
      requestId: 0,
      args: getArgs(this.props),
      data: initialValue,
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
      if (!this.props.waiting) {
        const thisId = this.state.requestId;

        mapPropsToRequest(this.state.args).then(
          (data) => {
            if (this.mounted && this.state.requestId === thisId) {
              this.setState({ data, isLoading: false, error: null }, () => {
                this.props.onFulfilled(data);
              });
            }
          },
          (error) => {
            if (this.mounted && this.state.requestid === thisId) {
              this.setState({ isLoading: false, error }, () => {
                this.props.onRejected(error);
              });
            }
          }
        );
      }
    };

    render() {
      const { render, component, children } = this.props;
      const renderProps = getRenderProps(this.state);

      if (component) return React.createElement(component, renderProps);
      if (render) return render(renderProps);
      if (typeof children === 'function') return children(renderProps);
      return null;
    }
  }

  return polyfill(RequestComponent);
}

export default createRequest;
