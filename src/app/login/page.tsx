import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginForm } from "@/components/login-form";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const session = await auth();
  if (session) redirect("/");

  const { callbackUrl } = await searchParams;

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-sm border border-border p-6">
        <h1 className="mb-1 text-lg font-semibold">Sign in</h1>
        <p className="mb-6 text-xs text-muted-foreground">
          Enter your credentials to access Short URL.
        </p>
        <LoginForm
          callbackUrl={
            typeof callbackUrl === "string" ? callbackUrl : undefined
          }
        />
      </div>
    </div>
  );
}
