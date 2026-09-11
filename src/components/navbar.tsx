"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  ChartBarIcon,
  LinkSimpleIcon,
  SignInIcon,
  SignOutIcon,
} from "@phosphor-icons/react";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";

const navItems = [
  { href: "/links", label: "Links", icon: LinkSimpleIcon },
  { href: "/analytics", label: "Analytics", icon: ChartBarIcon },
];

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background p-4">
      <nav className="flex h-4 w-full flex-row items-center justify-between">
        <Link href="/" className="text-sm font-semibold ">
          Short URL
        </Link>
        <div className="flex items-center gap-4">
          {session?.user && (
            <>
              <NavigationMenu>
                <NavigationMenuList>
                  {navItems.map(({ href, label, icon: Icon }) => {
                    const isActive =
                      pathname === href || pathname.startsWith(`${href}/`);

                    return (
                      <NavigationMenuItem key={href}>
                        <NavigationMenuLink
                          active={isActive}
                          render={<Link href={href} />}
                        >
                          <Icon className="size-4" />
                          {label}
                        </NavigationMenuLink>
                      </NavigationMenuItem>
                    );
                  })}
                </NavigationMenuList>
              </NavigationMenu>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Sign out"
                tooltip={session.user.email ?? "Sign out"}
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                <SignOutIcon className="size-4" />
              </Button>
            </>
          )}
          {!session?.user && (
            <Button
              variant="ghost"
              size="sm"
              nativeButton={false}
              render={<Link href="/login" />}
            >
              <SignInIcon className="size-4" />
              Login
            </Button>
          )}
          <ModeToggle />
        </div>
      </nav>
    </header>
  );
}
