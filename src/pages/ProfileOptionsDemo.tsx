import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  User, 
  Settings, 
  LogOut, 
  Camera, 
  ImagePlus, 
  Building2, 
  FileText, 
  MapPin, 
  Phone,
  Mail,
  Award,
  ChevronDown
} from "lucide-react";

export default function ProfileOptionsDemo() {
  const [activeNav, setActiveNav] = useState("sidebar");
  const [activePhoto, setActivePhoto] = useState("single");
  const [activeBrokerage, setActiveBrokerage] = useState("simple");

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Profile Portal Options</h1>
          <p className="text-muted-foreground">Click each tab to see different implementation styles</p>
        </div>

        {/* NAVIGATION OPTIONS */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm">1</span>
              Navigation Style
            </CardTitle>
            <CardDescription>Where should users access their profile?</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeNav} onValueChange={setActiveNav}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="sidebar">Sidebar Link</TabsTrigger>
                <TabsTrigger value="dropdown">Avatar Dropdown</TabsTrigger>
                <TabsTrigger value="dedicated">Dedicated Route</TabsTrigger>
              </TabsList>

              <TabsContent value="sidebar" className="mt-4">
                <div className="flex gap-4">
                  {/* Mock Sidebar */}
                  <div className="w-64 bg-muted rounded-lg p-4 space-y-2">
                    <div className="font-semibold mb-4">Showing Hub</div>
                    <div className="px-3 py-2 rounded-md hover:bg-accent cursor-pointer">Sessions</div>
                    <div className="px-3 py-2 rounded-md hover:bg-accent cursor-pointer">Clients</div>
                    <div className="px-3 py-2 rounded-md hover:bg-accent cursor-pointer">Properties</div>
                    <div className="border-t my-2" />
                    <div className="px-3 py-2 rounded-md bg-primary text-primary-foreground cursor-pointer flex items-center gap-2">
                      <User className="w-4 h-4" />
                      My Profile
                    </div>
                    <div className="px-3 py-2 rounded-md hover:bg-accent cursor-pointer flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      Settings
                    </div>
                  </div>
                  <div className="flex-1 flex items-center justify-center text-muted-foreground">
                    Profile link appears in the sidebar navigation
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="dropdown" className="mt-4">
                <div className="flex flex-col items-center gap-4">
                  {/* Mock Header */}
                  <div className="w-full bg-muted rounded-lg p-4 flex justify-between items-center">
                    <div className="font-semibold">Showing Hub</div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="flex items-center gap-2">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100" />
                            <AvatarFallback>JD</AvatarFallback>
                          </Avatar>
                          <span>John Doe</span>
                          <ChevronDown className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem className="cursor-pointer">
                          <User className="w-4 h-4 mr-2" />
                          My Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer">
                          <Settings className="w-4 h-4 mr-2" />
                          Settings
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="cursor-pointer text-destructive">
                          <LogOut className="w-4 h-4 mr-2" />
                          Sign Out
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <p className="text-muted-foreground">Click the avatar dropdown to access profile</p>
                </div>
              </TabsContent>

              <TabsContent value="dedicated" className="mt-4">
                <div className="flex flex-col items-center gap-4">
                  <div className="bg-muted rounded-lg p-4 font-mono text-sm">
                    yoursite.com<span className="text-primary font-bold">/profile</span>
                  </div>
                  <p className="text-muted-foreground">Standalone page accessible via direct URL</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">/profile</Button>
                    <Button variant="outline" size="sm">/profile/edit</Button>
                    <Button variant="outline" size="sm">/profile/settings</Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* PHOTO OPTIONS */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm">2</span>
              Photo Options
            </CardTitle>
            <CardDescription>How many photos can users upload?</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activePhoto} onValueChange={setActivePhoto}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="single">Single Avatar</TabsTrigger>
                <TabsTrigger value="cover">Avatar + Cover</TabsTrigger>
                <TabsTrigger value="gallery">Photo Gallery</TabsTrigger>
              </TabsList>

              <TabsContent value="single" className="mt-4">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <Avatar className="w-32 h-32">
                      <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200" />
                      <AvatarFallback className="text-2xl">JD</AvatarFallback>
                    </Avatar>
                    <Button size="icon" className="absolute bottom-0 right-0 rounded-full w-10 h-10">
                      <Camera className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="text-center">
                    <h3 className="font-semibold text-lg">John Doe</h3>
                    <p className="text-muted-foreground">Real Estate Agent</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="cover" className="mt-4">
                <div className="relative rounded-lg overflow-hidden">
                  {/* Cover Photo */}
                  <div className="h-48 bg-gradient-to-r from-primary/20 to-primary/40 relative">
                    <img 
                      src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800" 
                      alt="Cover" 
                      className="w-full h-full object-cover"
                    />
                    <Button size="sm" variant="secondary" className="absolute top-4 right-4">
                      <Camera className="w-4 h-4 mr-2" />
                      Change Cover
                    </Button>
                  </div>
                  {/* Profile Avatar */}
                  <div className="flex items-end gap-4 px-6 -mt-16 relative z-10">
                    <div className="relative">
                      <Avatar className="w-32 h-32 border-4 border-background">
                        <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200" />
                        <AvatarFallback className="text-2xl">JD</AvatarFallback>
                      </Avatar>
                      <Button size="icon" className="absolute bottom-0 right-0 rounded-full">
                        <Camera className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="pb-4">
                      <h3 className="font-semibold text-xl">John Doe</h3>
                      <p className="text-muted-foreground">Premier Real Estate Agent</p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="gallery" className="mt-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-20 h-20">
                      <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200" />
                      <AvatarFallback>JD</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">John Doe</h3>
                      <p className="text-muted-foreground text-sm">Portfolio Gallery</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                      <div key={i} className="aspect-square rounded-lg overflow-hidden bg-muted">
                        <img 
                          src={`https://images.unsplash.com/photo-156051888${i}-ce09059eeffa?w=200`} 
                          alt={`Gallery ${i}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=200";
                          }}
                        />
                      </div>
                    ))}
                    <div className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center cursor-pointer hover:bg-muted transition-colors">
                      <ImagePlus className="w-8 h-8 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* BROKERAGE OPTIONS */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm">3</span>
              Brokerage Details
            </CardTitle>
            <CardDescription>How much brokerage info should be captured?</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeBrokerage} onValueChange={setActiveBrokerage}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="simple">Just Name</TabsTrigger>
                <TabsTrigger value="license">Name + License</TabsTrigger>
                <TabsTrigger value="full">Full Details</TabsTrigger>
              </TabsList>

              <TabsContent value="simple" className="mt-4">
                <div className="max-w-md mx-auto space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="brokerage-simple">Brokerage Name</Label>
                    <Input id="brokerage-simple" placeholder="e.g., Keller Williams Realty" defaultValue="Coldwell Banker Premier" />
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Simple and clean - just the company name</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="license" className="mt-4">
                <div className="max-w-md mx-auto space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="brokerage-name">Brokerage Name</Label>
                    <Input id="brokerage-name" placeholder="e.g., Keller Williams Realty" defaultValue="Coldwell Banker Premier" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="license-number">License Number</Label>
                    <div className="flex gap-2">
                      <Input id="license-number" placeholder="e.g., DRE# 01234567" defaultValue="DRE# 02156789" />
                      <Button variant="outline" size="icon">
                        <Award className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Adds credibility with license verification</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="full" className="mt-4">
                <div className="max-w-2xl mx-auto">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Brokerage Name</Label>
                        <Input placeholder="Company name" defaultValue="Coldwell Banker Premier" />
                      </div>
                      <div className="space-y-2">
                        <Label>License Number</Label>
                        <Input placeholder="DRE# 01234567" defaultValue="DRE# 02156789" />
                      </div>
                      <div className="space-y-2">
                        <Label>Office Address</Label>
                        <div className="flex gap-2">
                          <MapPin className="w-4 h-4 mt-3 text-muted-foreground" />
                          <Input placeholder="123 Main St, Suite 100" defaultValue="500 Market St, Suite 200" />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Office Phone</Label>
                        <div className="flex gap-2">
                          <Phone className="w-4 h-4 mt-3 text-muted-foreground" />
                          <Input placeholder="(555) 123-4567" defaultValue="(415) 555-0123" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Office Email</Label>
                        <div className="flex gap-2">
                          <Mail className="w-4 h-4 mt-3 text-muted-foreground" />
                          <Input placeholder="office@brokerage.com" defaultValue="info@cbpremier.com" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Brokerage Logo</Label>
                        <div className="border-2 border-dashed rounded-lg p-4 text-center">
                          <Building2 className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">Upload logo</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-muted rounded-lg mt-4">
                    <p className="text-sm text-muted-foreground">Complete brokerage profile for maximum professionalism</p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Decision Summary */}
        <Card className="border-primary">
          <CardHeader>
            <CardTitle>Your Selection</CardTitle>
            <CardDescription>Tell me which options you prefer and I'll build it!</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-1">Navigation</p>
                <p className="text-primary font-semibold capitalize">{activeNav === "sidebar" ? "Sidebar Link" : activeNav === "dropdown" ? "Avatar Dropdown" : "Dedicated Route"}</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-1">Photos</p>
                <p className="text-primary font-semibold capitalize">{activePhoto === "single" ? "Single Avatar" : activePhoto === "cover" ? "Avatar + Cover" : "Photo Gallery"}</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-1">Brokerage</p>
                <p className="text-primary font-semibold capitalize">{activeBrokerage === "simple" ? "Just Name" : activeBrokerage === "license" ? "Name + License" : "Full Details"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
