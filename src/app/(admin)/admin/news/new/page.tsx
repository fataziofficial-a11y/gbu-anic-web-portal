import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { availablePlatforms } from "@/lib/crosspost/available";
import { NewsForm } from "@/components/admin/NewsForm";

export const metadata = { title: "Новая новость — CMS АНИЦ" };

// Список подключённых площадок читается из окружения при каждом открытии.
export const dynamic = "force-dynamic";

export default async function NewNewsPage() {
  const session = await auth();
  if (!session) redirect("/admin/login");

  return <NewsForm mode="create" platforms={availablePlatforms()} />;
}
