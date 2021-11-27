import React, { ReactNode } from 'react';
import PropTypes from 'prop-types';
import omit from 'lodash/omit';
import { shallowEqual, isPromise } from './utils';

const propTypes = {
  component: PropTypes.func,
  render: PropTypes.func,
  children: PropTypes.oneOfType([PropTypes.func, PropTypes.node]),
  onFulfilled: PropTypes.func,
  onRejected: PropTypes.func,
};

const defaultOptions = {
  debounce: () => false,
  shouldDataUpdate: (
    props: Record<string, unknown>,
    nextProps: Record<string, unknown>,
  ) => !shallowEqual(props, nextProps),
};

interface Options<RequestProps> {
  debounce?: (props: RequestProps) => false | number;
  shouldDataUpdate?: (props: RequestProps, nextProps: RequestProps) => boolean;
}

type Request<DataType> = false | null | undefined | PromiseLike<DataType>;

interface State<DataType> {
  isLoading: boolean;
  args: Record<string, unknown>;
  data: DataType;
  error: null | Error;
}

interface RenderProps<DataType> extends State<DataType> {
  updateData: () => void;
}

type Props<DataType, RequestProps> = RequestProps & {
  component?: React.ComponentType<RenderProps<DataType>>;
  render?: (renderProps: RenderProps<DataType>) => ReactNode;
  children?: (renderProps: RenderProps<DataType>) => ReactNode;
  onFulfilled: (data: DataType) => void;
  onRejected: (error: Error) => void;
};

const getRequestProps = <DataType, RequestProps extends Record<string, unknown>>({
  component,
  render,
  children,
  onFulfilled,
  onRejected,
  ...props
}: Props<DataType, RequestProps>): RequestProps => props;

function createRequest<DataType, RequestProps>(
  initialValue: DataType,
  mapPropsToRequest: (props: RequestProps) => Request<DataType>,
  options: Options<RequestProps>,
): React.Component {
  const { debounce, shouldDataUpdate } = {
    ...defaultOptions,
    ...options,
  };

  class RequestComponent extends React.Component<
    Props<DataType, RequestProps>,
    State<DataType>
  > {
    timeout: undefined | number;

    requestProps: RequestProps;

    request: Request<DataType>;

    constructor(props: Props<DataType, RequestProps>) {
      super(props);
      this.timeout = undefined;
      this.requestProps = getRequestProps(props);
      this.request = mapPropsToRequest(this.requestProps);
      this.state = {
        isLoading: isPromise(this.request),
        args: {},
        data: initialValue,
        error: null,
      };
    }

    componentDidMount() {
      this.fetchData(this.requestProps, this.request);
    }

    componentDidUpdate() {
      const nextRequestProps = getRequestProps(this.props);

      if (shouldDataUpdate(this.requestProps, nextRequestProps)) {
        const wait = debounce(this.requestProps, nextRequestProps);

        if (typeof wait === 'number' && wait > 0) {
          clearTimeout(this.timeout);
          this.timeout = window.setTimeout(() => {
            this.requestProps = nextRequestProps;
            this.fetchData(nextRequestProps);
          }, wait);
        } else {
          this.requestProps = nextRequestProps;
          this.fetchData(nextRequestProps);
        }
      }
    }

    componentWillUnmount() {
      this.request = null;
      clearTimeout(this.timeout);
    }

    setLoading = (value: boolean) => {
      this.setState(({ isLoading }) =>
        isLoading === value ? null : { isLoading: value },
      );
    };

    fetchData = (args, request = mapPropsToRequest(args)) => {
      if (!isPromise(request)) return;

      if (this.timeout !== null) {
        clearTimeout(this.timeout);
        this.timeout = undefined;
      }

      this.request = request;
      this.setLoading(true);
      request.then(
        (data) => {
          if (this.request === request) {
            this.setState({ args, data, isLoading: false, error: null }, () =>
              this.props.onFulfilled(data),
            );
          }
        },
        (error) => {
          if (this.request === request) {
            this.setState({ args, isLoading: false, error }, () =>
              this.props.onRejected(error),
            );
          }
        },
      );
    };

    updateData = () => this.fetchData();

    render() {
      const { render, component, children } = this.props;
      const renderProps = { ...this.state, updateData: this.updateData };
      if (component) return React.createElement(component, renderProps);
      if (render) return render(renderProps);
      if (typeof children === 'function') return children(renderProps);
      return null;
    }
  }

  RequestComponent.propTypes = propTypes;
  RequestComponent.defaultProps = {
    onFulfilled: () => {},
    onRejected: () => {},
  };

  return RequestComponent;
}

export default createRequest;
