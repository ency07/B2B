'use client';

import * as React from 'react';
import { useDesignSystem } from '../provider/useTheme';
import { cn } from '@/platform/utils/cn';

interface ThemedPortalProps {
  children: React.ReactNode;
  className?: string;
}

export function ThemedPortal({ children, className }: ThemedPortalProps) {
  const { cssVars } = useDesignSystem();

  const style = React.useMemo(() => {
    const styles: Record<string, string> = {};
    for (const [key, value] of Object.entries(cssVars)) {
      styles[key] = value;
    }
    return styles;
  }, [cssVars]);

  return (
    <div
      className={cn('ds-themed-portal', className)}
      style={style}
      data-ds-theme-root="true"
    >
      {children}
    </div>
  );
}

interface ThemedPortalContentProps {
  children: React.ReactNode;
  className?: string;
}

export function ThemedPortalContent({ children, className }: ThemedPortalContentProps) {
  const { cssVars } = useDesignSystem();

  const style = React.useMemo(() => {
    const styles: Record<string, string> = {};
    for (const [key, value] of Object.entries(cssVars)) {
      styles[key] = value;
    }
    return styles;
  }, [cssVars]);

  return (
    <div
      className={cn('ds-themed-portal-content', className)}
      style={style}
    >
      {children}
    </div>
  );
}

export function ThemedDialogPortal({ children }: { children: React.ReactNode }) {
  return <ThemedPortal>{children}</ThemedPortal>;
}

export function ThemedSheetPortal({ children }: { children: React.ReactNode }) {
  return <ThemedPortal>{children}</ThemedPortal>;
}