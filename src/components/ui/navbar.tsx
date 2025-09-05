import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Search, Home, Film, Tv, Drama, BookOpen, Menu, X, User, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import { SearchModal } from "@/components/SearchModal";

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { profile } = useUserProfile();

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      // Error handled in AuthContext
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2">
          <div className="text-2xl font-bold gradient-primary bg-clip-text text-transparent">
            Revius
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6">
          <Button 
            variant={isActive("/") ? "secondary" : "ghost"} 
            size="sm" 
            className={cn(
              "text-muted-foreground hover:text-primary transition-smooth",
              isActive("/") && "text-primary"
            )}
            asChild
          >
            <Link to="/">
              <Home className="h-4 w-4 mr-2" />
              Home
            </Link>
          </Button>
          <Button 
            variant={isActive("/movies") ? "secondary" : "ghost"} 
            size="sm" 
            className={cn(
              "text-muted-foreground hover:text-primary transition-smooth",
              isActive("/movies") && "text-primary"
            )}
            asChild
          >
            <Link to="/movies">
              <Film className="h-4 w-4 mr-2" />
              Movies
            </Link>
          </Button>
          <Button 
            variant={isActive("/tv-shows") ? "secondary" : "ghost"} 
            size="sm" 
            className={cn(
              "text-muted-foreground hover:text-primary transition-smooth",
              isActive("/tv-shows") && "text-primary"
            )}
            asChild
          >
            <Link to="/tv-shows">
              <Tv className="h-4 w-4 mr-2" />
              TV Shows
            </Link>
          </Button>
          <Button 
            variant={isActive("/novelas") ? "secondary" : "ghost"} 
            size="sm" 
            className={cn(
              "text-muted-foreground hover:text-primary transition-smooth",
              isActive("/novelas") && "text-primary"
            )}
            asChild
          >
            <Link to="/novelas">
              <Drama className="h-4 w-4 mr-2" />
              Novelas
            </Link>
          </Button>
          <Button 
            variant={isActive("/anime") ? "secondary" : "ghost"} 
            size="sm" 
            className={cn(
              "text-muted-foreground hover:text-primary transition-smooth",
              isActive("/anime") && "text-primary"
            )}
            asChild
          >
            <Link to="/anime">
              <BookOpen className="h-4 w-4 mr-2" />
              Anime
            </Link>
          </Button>
        </div>

        {/* Search Bar */}
        <div className="hidden md:flex items-center space-x-4 flex-1 max-w-sm ml-8">
          <SearchModal>
            <div className="relative w-full cursor-pointer">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search movies, shows, anime..."
                className="pl-10 bg-muted/50 border-border transition-smooth focus:bg-background cursor-pointer"
                readOnly
              />
            </div>
          </SearchModal>
        </div>

        {/* User Actions */}
        <div className="flex items-center space-x-4">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 rounded-full p-0" data-testid="user-menu">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.avatar_url || ""} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {profile?.username?.charAt(0).toUpperCase() || 
                       user.user_metadata?.username?.charAt(0).toUpperCase() || 
                       user.email?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="default" size="sm" className="hidden md:inline-flex shadow-primary" asChild>
              <Link to="/login">Sign In</Link>
            </Button>
          )}
          
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="container mx-auto px-4 py-4 space-y-2">
            <SearchModal>
              <div className="relative mb-4 cursor-pointer">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  className="pl-10 bg-muted/50 border-border cursor-pointer"
                  readOnly
                />
              </div>
            </SearchModal>
            <Button variant="ghost" className="w-full justify-start" asChild>
              <Link to="/">
                <Home className="h-4 w-4 mr-2" />
                Home
              </Link>
            </Button>
            <Button variant="ghost" className="w-full justify-start" asChild>
              <Link to="/movies">
                <Film className="h-4 w-4 mr-2" />
                Movies
              </Link>
            </Button>
            <Button variant="ghost" className="w-full justify-start" asChild>
              <Link to="/tv-shows">
                <Tv className="h-4 w-4 mr-2" />
                TV Shows
              </Link>
            </Button>
            <Button variant="ghost" className="w-full justify-start" asChild>
              <Link to="/novelas">
                <Drama className="h-4 w-4 mr-2" />
                Novelas
              </Link>
            </Button>
            <Button variant="ghost" className="w-full justify-start" asChild>
              <Link to="/anime">
                <BookOpen className="h-4 w-4 mr-2" />
                Anime
              </Link>
            </Button>
            {user ? (
              <div className="space-y-2 mt-4">
                <Button variant="ghost" className="w-full justify-start" asChild>
                  <Link to="/profile">
                    <User className="h-4 w-4 mr-2" />
                    Profile
                  </Link>
                </Button>
                <Button variant="outline" className="w-full" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <Button variant="default" className="w-full mt-4" asChild>
                <Link to="/login">Sign In</Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}