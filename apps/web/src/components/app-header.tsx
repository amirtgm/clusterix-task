import { useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut, useSession } from "@/lib/auth";
import { cn } from "@/lib/utils";

export function AppHeader() {
  const { data: session } = useSession();
  const navigate = useNavigate();
  const location = useLocation();

  const userName = session?.user?.name || session?.user?.email || "Guest";
  const initials = useMemo(() => {
    if (!userName) return "U";
    return userName
      .split(" ")
      .map((part) => part.charAt(0).toUpperCase())
      .slice(0, 2)
      .join("");
  }, [userName]);

  const avatarSrc =
    session?.user?.image ||
    `https://avatar.vercel.sh/${session?.user?.id ?? "guest"}.png`;

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <header className="border-b bg-background">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="text-base font-semibold">
          Clusterix
        </Link>
        {session ? (
          <div className="flex items-center gap-4">
            <nav className="hidden md:flex items-center gap-4 text-sm text-muted-foreground">
              <HeaderLink to="/" active={location.pathname === "/"}>
                News
              </HeaderLink>
              <HeaderLink
                to="/settings"
                active={location.pathname.startsWith("/settings")}
              >
                Settings
              </HeaderLink>
            </nav>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 rounded-full px-2 py-1"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={avatarSrc} alt={userName} />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <span className="hidden text-sm font-medium md:inline">
                    {userName}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  {session.user?.email}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/settings">Account settings</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onSelect={(event) => {
                    event.preventDefault();
                    handleLogout();
                  }}
                >
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <Button asChild size="sm">
            <Link to="/login">Log in</Link>
          </Button>
        )}
      </div>
    </header>
  );
}

type HeaderLinkProps = {
  to: string;
  active?: boolean;
  children: React.ReactNode;
};

function HeaderLink({ to, active, children }: HeaderLinkProps) {
  return (
    <Link
      to={to}
      className={cn(
        "transition-colors hover:text-foreground",
        active && "text-foreground font-medium"
      )}
    >
      {children}
    </Link>
  );
}
