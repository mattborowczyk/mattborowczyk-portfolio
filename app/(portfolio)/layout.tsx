import AppShell from "@/components/app-shell";
import NewsletterCard from "@/components/newsletter-card";

export default function PortfolioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AppShell>{children}</AppShell>
      <NewsletterCard />
    </>
  );
}
