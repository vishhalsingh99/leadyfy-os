"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PendingOverlay } from "@/components/pending-overlay";
import { login, type LoginResult } from "./actions";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState<LoginResult, FormData>(login, undefined);

  return (
    <Card className="w-full max-w-sm border-border">
      <CardHeader>
        <CardTitle className="text-primary">Leadyfy OS</CardTitle>
        <CardDescription>Sign in to your agency workspace.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          <PendingOverlay active={isPending} />
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" autoComplete="current-password" required />
          </div>
          {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
          <Button type="submit" disabled={isPending} className="mt-2">
            {isPending ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
