import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AppNavigation } from "@/components/app-navigation";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <AppNavigation />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
