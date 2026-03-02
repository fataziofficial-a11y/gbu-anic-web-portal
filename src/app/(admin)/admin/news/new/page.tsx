import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { NewsForm } from "@/components/admin/NewsForm";

export const metadata = { title: "Новая новость — CMS АНИЦ" };

export default async function NewNewsPage() {
  const session = await auth();
  if (!session) redirect("/admin/login");

  return <NewsForm mode="create" />;
}
