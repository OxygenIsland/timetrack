/**
 * ErrorBoundary - 错误边界
 *
 * 捕获子组件渲染错误，避免整个应用崩溃。
 * 上报前端错误到后端（错误码 E-FE-001）。
 */

import { Component, type ReactNode, type ErrorInfo } from 'react';
import { Result, Button } from 'antd';
import { ErrorCodes } from '../../../core/error/types';
import { apiClient } from '../../../core/api/apiClient';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[ErrorBoundary] 捕获到错误', error, errorInfo);
    this.setState({ errorInfo });

    // 上报到后端（异步，失败不影响 UI）
    this.reportError(error, errorInfo).catch(() => {
      // 静默失败
    });
  }

  private async reportError(error: Error, errorInfo: ErrorInfo): Promise<void> {
    const payload = {
      code: ErrorCodes.FE_RENDER_FAILED,
      message: error.message,
      stack: error.stack,
      component_stack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
    };

    try {
      // 一期后端可能没开这个接口，catch 一下即可
      await apiClient.post('/fe/errors', payload);
    } catch {
      // 静默
    }
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Result
          status="error"
          title="页面出错了"
          subTitle={this.state.error?.message || '请刷新页面或联系运维人员'}
          extra={
            <Button type="primary" onClick={this.handleReset}>
              重试
            </Button>
          }
        />
      );
    }

    return this.props.children;
  }
}
