import React from 'react';
import { shallowEqual, omit } from './utils';

function createRequest(initialValue, request) {
  return class RequestComponent extends React.Component {
    state = {
      isLoading: true,
      data: initialValue,
      error: null
    };

    componentDidMount() {
      this.fetchData();
    }

    componentWillReceiveProps(nextProps) {
      const nextArgs = omit(nextProps, ["render"]);
      const currentArgs = omit(this.props, ["render"]);

      if (!shallowEqual(currentArgs, nextArgs)) {
        this.shouldUpdate = true;
        this.setState({ isLoading: true });
      }
    }

    componentDidUpdate() {
      if (this.shouldUpdate) {
        this.shouldUpdate = false;
        this.fetchData();
      }
    }

    latestRequestId = 0;

    fetchData = () => {
      this.latestRequestId += 1;
      const requestId = this.latestRequestId;
      const args = omit(this.props, ["render"]);

      request(args).then(
        data => {
          if (this.latestRequestId === requestId) {
            this.setState({ data, isLoading: false, error: null });
          }
        },
        error => {
          if (this.latestRequestId === requestId) {
            this.setState({ isLoading: false, error });
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
