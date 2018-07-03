import React from 'react';
import PropTypes from 'prop-types';
import { polyfill } from 'react-lifecycles-compat';
import { shallowEqual, omit } from './utils';

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

const getArgs = props => omit(props, Object.keys(propTypes));
const getRenderProps = state => omit(state, ['requestId', 'args']);

function createRequest(initialValue, mapPropsToRequest) {
  class RequestComponent extends React.Component {
    static propTypes = propTypes;
    static defaultProps = {
      initialValue,
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

    fetchData = (args = this.state.args) => {
      const thisId = this.state.requestId;
      const request = mapPropsToRequest(args);

      if (request !== null && request !== false) {
        request.then(
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

      const renderProps = Object.assign({}, getRenderProps(this.state), {
        updateData: this.fetchData
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
