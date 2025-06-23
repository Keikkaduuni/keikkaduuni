import React from 'react';
import classNames from 'classnames';

export const Card = ({ className, children }: { className?: string; children: React.ReactNode }) => {
  return (
    <div className={classNames("rounded-2xl shadow-md border border-white/10 bg-white/5 p-4", className)}>
      {children}
    </div>
  );
};

export const CardContent = ({ children }: { children: React.ReactNode }) => {
  return <div className="p-2">{children}</div>;
};
