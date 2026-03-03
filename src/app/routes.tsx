import { createBrowserRouter } from 'react-router';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './pages/DashboardLayout';
import DashboardHome from './pages/DashboardHome';
import LeadsPage from './pages/LeadsPage';
import LeadDetailsPage from './pages/LeadDetailsPage';
import CallsPage from './pages/CallsPage';
import CalendarPage from './pages/CalendarPage';
import ReportsPage from './pages/ReportsPage';
import UsersPage from './pages/UsersPage';
import AutoDialPage from './pages/AutoDialPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ImportCSVPage from './pages/ImportCSVPage';
import SettingsPage from './pages/SettingsPage';
import ActivityTimelinePage from './pages/ActivityTimelinePage';
import TemplatesPage from './pages/TemplatesPage';
import DataCollectionPage from './pages/DataCollectionPage';
import SalesPipelinePage from './pages/SalesPipelinePage';
import EmployeePerformancePage from './pages/EmployeePerformancePage';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: LoginPage,
  },
  {
    path: '/login',
    Component: LoginPage,
  },
  {
    path: '/dashboard',
    Component: DashboardLayout,
    children: [
      {
        index: true,
        Component: DashboardHome,
      },
      {
        path: 'leads',
        Component: LeadsPage,
      },
      {
        path: 'leads/:id',
        Component: LeadDetailsPage,
      },
      {
        path: 'calls',
        Component: CallsPage,
      },
      {
        path: 'auto-dial',
        Component: AutoDialPage,
      },
      {
        path: 'calendar',
        Component: CalendarPage,
      },
      {
        path: 'reports',
        Component: ReportsPage,
      },
      {
        path: 'analytics',
        Component: AnalyticsPage,
      },
      {
        path: 'import',
        Component: ImportCSVPage,
      },
      {
        path: 'settings',
        Component: SettingsPage,
      },
      {
        path: 'activity',
        Component: ActivityTimelinePage,
      },
      {
        path: 'templates',
        Component: TemplatesPage,
      },
      {
        path: 'collect',
        Component: DataCollectionPage,
      },
      {
        path: 'users',
        Component: UsersPage,
      },
      {
        path: 'employee-performance',
        Component: EmployeePerformancePage,
      },
      {
        path: 'pipeline',
        Component: SalesPipelinePage,
      },
    ],
  },
]);