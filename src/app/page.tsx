import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Redirect based on role
  if (session.user.role === "KITCHEN") {
    redirect("/input-harian");
  } else {
    redirect("/dashboard");
  }
}

