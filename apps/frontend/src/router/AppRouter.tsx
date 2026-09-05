/**
 * 路由（自动从模块注册中心获取所有路由）
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from '../components/layout/MainLayout';
import { moduleRegistry } from '../core/registry/ModuleRegistry';

export function AppRouter() {
  const routes = moduleRegistry.getAllRoutes();

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route element={<MainLayout />}>
        {routes.map((route) => (
          <Route
            key={route.path}
            path={route.path}
            element={<route.component />}
          />
        ))}
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
