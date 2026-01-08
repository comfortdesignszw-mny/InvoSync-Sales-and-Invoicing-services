
import React, { ReactNode } from 'react';

interface PageWrapperProps {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
}

const PageWrapper: React.FC<PageWrapperProps> = ({ title, actions, children }) => {
  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-text-main">{title}</h1>
        {actions && <div className="flex items-center space-x-2">{actions}</div>}
      </header>
      <div className="bg-white p-6 rounded-lg shadow-sm">
        {children}
      </div>
    </div>
  );
};

export default PageWrapper;
