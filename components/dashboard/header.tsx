'use client';

import { usePathname } from 'next/navigation';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

const pageNames: Record<string, string> = {
  '/dashboard': 'Overview',
  '/dashboard/income': 'Income',
  '/dashboard/expenses': 'Expenses',
  '/dashboard/debts': 'Debts & EMIs',
  '/dashboard/investments': 'Investments',
  '/dashboard/assets': 'Assets',
  '/dashboard/goals': 'Goals',
  '/dashboard/recommendations': 'AI Recommendations',
  '/dashboard/settings': 'Settings',
};

export function DashboardHeader() {
  const pathname = usePathname();
  const pageName = pageNames[pathname] || 'Dashboard';

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="h-4" />
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          {pathname !== '/dashboard' && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{pageName}</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>
    </header>
  );
}
