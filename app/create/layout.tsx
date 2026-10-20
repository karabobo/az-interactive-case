import { Sidebar } from "@/components/layout/Sidebar";
import { CreateStepperBar } from "@/app/create/CreateStepperBar";
import { getCurrentUser } from "@/lib/server/auth";
import { redirect } from "next/navigation";

export default async function CreateLayout({ children }: LayoutProps<"/create">) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return (
    <div className="flex h-screen bg-background">
      <Sidebar user={user} />
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="mx-auto flex max-w-4xl flex-col gap-6">
          <CreateStepperBar />
          {children}
        </div>
      </div>
    </div>
  );
}
