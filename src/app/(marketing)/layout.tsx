import { DesignSystemProvider } from '@/design-system';
import "./marketing.css";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DesignSystemProvider>{children}</DesignSystemProvider>;
}