import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Star, Users, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { SearchModal } from "@/components/SearchModal";
import heroImage from "@/assets/hero-revius.jpg";

export function HeroSection() {
  return (
    <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
      {/* Background with overlay */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Revius Hero"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background/90" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto text-center px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Main heading */}
          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
              <span className="gradient-primary bg-clip-text text-transparent">
                Revius
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              The social platform for movie lovers, anime fans, and entertainment enthusiasts.
              Discover, review, and share your favorite content.
            </p>
          </div>

          {/* Search bar */}
          <div className="max-w-2xl mx-auto">
            <SearchModal>
              <div className="relative cursor-pointer">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search for movies, TV shows, anime, games..."
                  className="pl-12 pr-4 py-6 text-lg bg-card/80 border-border/50 backdrop-blur-sm transition-smooth focus:bg-card focus:shadow-primary cursor-pointer"
                  readOnly
                />
                <Button 
                  size="lg" 
                  className="absolute right-2 top-1/2 -translate-y-1/2 shadow-primary"
                >
                  Search
                </Button>
              </div>
            </SearchModal>
          </div>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" className="shadow-primary transition-bounce hover:scale-105" asChild>
              <Link to="/register">Get Started Free</Link>
            </Button>
            <Button size="lg" variant="outline" className="border-border/50 hover:bg-card/50 transition-bounce hover:scale-105" asChild>
              <Link to="/movies">Explore Popular</Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto mt-16">
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center">
                <Star className="h-6 w-6 text-accent mr-2" />
                <span className="text-2xl font-bold text-primary">10M+</span>
              </div>
              <p className="text-sm text-muted-foreground">Reviews & Ratings</p>
            </div>
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center">
                <Users className="h-6 w-6 text-accent mr-2" />
                <span className="text-2xl font-bold text-primary">500K+</span>
              </div>
              <p className="text-sm text-muted-foreground">Active Users</p>
            </div>
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-accent mr-2" />
                <span className="text-2xl font-bold text-primary">1M+</span>
              </div>
              <p className="text-sm text-muted-foreground">Titles Tracked</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}