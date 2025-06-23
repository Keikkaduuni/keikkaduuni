import React from 'react';

export const Tabs = ({ children }: { children: React.ReactNode }) => (
  <div className="tabs">{children}</div>
);

export const TabsList = ({ children }: { children: React.ReactNode }) => (
  <div className="tabs-list flex gap-2 mb-4">{children}</div>
);

export const TabsTrigger = ({
  children,
  value,
  activeTab,
  setActiveTab,
}: {
  children: React.ReactNode;
  value: string;
  activeTab: string;
  setActiveTab: (val: string) => void;
}) => (
  <button
    onClick={() => setActiveTab(value)}
    className={`px-4 py-2 rounded ${
      activeTab === value ? 'bg-white text-black' : 'bg-black text-white border border-white'
    } transition`}
  >
    {children}
  </button>
);

export const TabsContent = ({
  value,
  activeTab,
  children,
}: {
  value: string;
  activeTab: string;
  children: React.ReactNode;
}) => {
  if (value !== activeTab) return null;
  return <div>{children}</div>;
};
