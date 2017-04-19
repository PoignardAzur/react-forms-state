"use babel";
// @flow
import React from "react";
import StateProxy from "./StateProxy";
import {
  INITIAL_CHANGE_EVENT_TYPE,
  VALIDATION_FAILED_EVENT_TYPE,
} from "./FormEvents";
import Rx from "rxjs";

export default class StateInjector
  extends React.Component<DefaultProps, Props, State> {
  state: State;
  props: Props;
  watchPath: string;
  valueChangeObs: Rx.Observable;
  subscription: Rx.Subscription;
  static defaultProps: DefaultProps;

  constructor(props: Props, context: Context) {
    super(props);

    this.state = {
      value: null,
      validation: true,
    };

    this.watchPath = this.getWatchedPath(props, context);
    this.valueChangeObs = context.rootValueChangeObs.filter(e => {
      // console.log("FILTERING", e, "In watcher", this.watchPath);
      if (e.statePath)
        return (
          this.watchPath.startsWith(e.statePath) ||
          e.statePath.startsWith(this.watchPath)
        );
      else if (e.type === INITIAL_CHANGE_EVENT_TYPE) return true;
      else if (e.type === VALIDATION_FAILED_EVENT_TYPE) return true;
      else return false;
    });
  }

  getWatchedPath(props: Props, context: Context): string {
    return typeof props.watchPath === "function"
      ? props.watchPath(context.completeStatePath || "")
      : props.watchPath;
  }

  componentDidMount() {
    this.subscription = this.valueChangeObs.subscribe(e => {
      this.setState({
        value: e.value,
        validation: e.validation,
      });
    });
  }

  componentWillUnmount() {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
  }

  render() {
    if (typeof this.props.children !== "function")
      throw new Error(
        "children of StateInjector must be a function of type (stateValue, props) => React$element",
      );
    return this.props.children(this.state.value, this.props, {
      watchedStatePath: this.watchPath,
      validation: this.state.validation,
    });
  }
}

StateInjector.propTypes = {};

StateInjector.defaultProps = {};

StateInjector.contextTypes = {
  rootValueChangeObs: React.PropTypes.any,
  completeStatePath: React.PropTypes.string,
};

type DefaultProps = {};

type Props = {
  watchPath: string | ((path: string) => string),
};

type State = {
  value: any,
  validation: any,
};

type Context = {
  completeStatePath?: string,
  rootValueChangeObs: Rx.Observable,
};