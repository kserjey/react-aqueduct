import React from 'react';
import { shallowEqual, omit } from './utils';

const getArgs = props => omit(props, ['render', 'onFulfilled', 'onRejected']);

function createRequest(initialValue, request) {
  return class RequestComponent extends React.Component {
    static defaultProps = {
      onFulfilled: () => {},
      onRejected: () => {}
    };

    state = {
      isLoading: true,
      data: initialValue,
      error: null
    };

    componentDidMount() {
      this.mounted = true;
      this.fetchData();
    }

    componentWillReceiveProps(nextProps) {
      const nextArgs = getArgs(nextProps);
      const args = getArgs(this.props);

      if (!shallowEqual(args, nextArgs)) {
        this.setState({ isLoading: true }, () => {
          this.fetchData();
        });
      }
    }

    componentWillUnmount() {
      this.mounted = false;
    }

    mounted = false;
    latestRequestId = 0;

    fetchData = () => {
      this.latestRequestId += 1;
      const requestId = this.latestRequestId;
      const args = getArgs(this.props);

      request(args).then(
        (data) => {
          if (this.mounted && this.latestRequestId === requestId) {
            this.setState({ data, isLoading: false, error: null }, () => {
              this.props.onFulfilled(data);
            });
          }
        },
        (error) => {
          if (this.mounted && this.latestRequestId === requestId) {
            this.setState({ isLoading: false, error }, () => {
              this.props.onRejected(error);
            });
          }
        }
      );
    };

    render() {
      return this.props.render(this.state);
    }
  };
}

export default createRequest;
