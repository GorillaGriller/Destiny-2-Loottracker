import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";

export const AuthDialog = ({ open, onOpenChange }) => {
  const { login, register } = useAuth();
  const [tab, setTab] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    setBusy(true);
    try {
      if (tab === "login") { await login(email, password); toast.success("Signed in — progress synced"); }
      else { await register(email, password); toast.success("Account created — progress synced"); }
      onOpenChange(false); setEmail(""); setPassword("");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Something went wrong");
    } finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="auth-dialog" className="max-w-md border-white/10 bg-[#0b0f14]">
        <DialogHeader>
          <DialogTitle className="font-display">Guardian Account</DialogTitle>
          <DialogDescription>Sync your checklist & favorites across devices.</DialogDescription>
        </DialogHeader>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-2 border border-white/10 bg-white/5">
            <TabsTrigger value="login" data-testid="auth-tab-login">Sign In</TabsTrigger>
            <TabsTrigger value="register" data-testid="auth-tab-register">Create Account</TabsTrigger>
          </TabsList>
          <TabsContent value={tab} className="mt-4">
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="auth-email">Email</Label>
                <Input id="auth-email" data-testid="auth-email-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="guardian@destiny.com" className="border-white/10 bg-white/5" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="auth-password">Password</Label>
                <Input id="auth-password" data-testid="auth-password-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters" className="border-white/10 bg-white/5" required minLength={6} />
              </div>
              <Button type="submit" className="w-full" disabled={busy} data-testid="auth-submit-button">
                {busy ? "Please wait…" : tab === "login" ? "Sign In" : "Create Account"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
